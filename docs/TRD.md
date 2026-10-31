# TRD — Technical Requirements Document

**Status:** BASELINE v0.1 — the agent may change any choice below if it records the reason in the Decision Log (end of file). Facts marked **(verify)** may have changed; check current docs before relying on them.

---

## 1. Technology decisions

| Area | Baseline choice | Why | Alternatives the agent may pick |
|---|---|---|---|
| App framework | **Next.js (App Router) + TypeScript** | One repo, one deploy, SSR + API routes, easy streaming | Python FastAPI backend + React/Vite frontend (better for heavy parsing; needs separate host) |
| UI | Tailwind CSS + shadcn/ui | Fast, polished, accessible | Any |
| Database | **MongoDB Atlas** (M0 free to start) | Track-2 requirement: sources, chunks, embeddings, metadata together; Vector Search; Atlas Search | — |
| Vector retrieval | Atlas **Vector Search** (`$vectorSearch`) with pre-filters | Required | — |
| Lexical retrieval | Atlas **Search** (`$search`, BM25-style) | Exact names/IDs/codes | Native `$rankFusion` / `$scoreFusion` if cluster version supports it **(verify)** |
| Fusion | **Reciprocal Rank Fusion in app code** (k≈60) | Works on any tier, fully transparent for the "X-ray" view | `$rankFusion` aggregation stage |
| Embeddings | **Voyage AI** (e.g. `voyage-4` family, 1024-d) **(verify model names/dims)** | MongoDB-aligned, strong retrieval quality | Atlas **Automated Embedding** (`autoEmbed` index) — requires **M10+** cluster **(verify)**; Gemini embeddings as fallback |
| Rerank (P1) | Voyage rerank model **(verify name)** | Cheap precision boost | Skip, or LLM-as-reranker |
| LLM | **Google Gemini API** (Flash-class, model name via env) | Free tier from AI Studio; structured JSON output; fast | Claude/OpenAI/Groq/OpenRouter via provider abstraction |
| Parsing | `unpdf` or `pdf-parse` (PDF), `marked`/`remark` (MD), `cheerio`/`@mozilla/readability` (HTML), `papaparse` (CSV) | Serverless-friendly | Python `pymupdf` in a worker |
| Validation | `zod` (+ Mongo `$jsonSchema` validators on core collections) | Required-field safety | — |
| Hosting | **Vercel** (Hobby) for app; Atlas for DB | Public URL in minutes, GitHub integration | Render / Railway / Fly.io (better for long jobs / FastAPI) |
| Optional integration | **n8n** (cloud trial) webhook → `/api/ingest` | Sponsor tool; shows automation | skip |
| Tests | Vitest + a custom eval runner (`npm run eval`) | Retrieval test set is a Track-2 expectation | pytest |

**Provider abstraction is mandatory**: `EmbeddingProvider`, `LLMProvider`, `Reranker` interfaces so a rate-limited provider can be swapped with an env change.

## 2. Environment variables (see `.env.example`)
Server-only; never prefix with `NEXT_PUBLIC_` unless truly public.

| Var | Purpose |
|---|---|
| `MONGODB_URI` | Atlas connection string |
| `MONGODB_DB` | Database name (e.g. `evidence_engine`) |
| `VOYAGE_API_KEY` | Embeddings / rerank |
| `EMBEDDING_MODEL`, `EMBEDDING_DIMS` | Must match the vector index |
| `GEMINI_API_KEY` | LLM |
| `LLM_MODEL` | e.g. a current Flash model from AI Studio **(verify)** |
| `ADMIN_TOKEN` | Guards seed/reset/eval endpoints |
| `DEMO_PASSCODE` (optional) | Simple gate if open access is unwise |
| `RATE_LIMIT_PER_MIN` | Abuse guard |
| `N8N_WEBHOOK_SECRET` (optional) | HMAC for n8n → app calls |

## 3. Repository layout (suggested)
```
/
├─ AGENTS.md
├─ README.md                  # judge-facing (template in docs/SUBMISSION.md)
├─ .env.example
├─ docs/                      # these docs (keep updated)
├─ data/
│  ├─ corpus/                 # seed sources (licensed/synthetic) + MANIFEST.md (origin, license)
│  └─ eval/cases.json         # questions + expected source IDs + expected state
├─ scripts/
│  ├─ setup-db.ts             # create collections, validators, indexes (idempotent)
│  ├─ seed.ts                 # ingest data/corpus
│  └─ eval.ts                 # run eval set, print + store metrics
├─ src/
│  ├─ app/                    # pages + route handlers
│  │  ├─ api/ingest/ api/sources/ api/query/ api/chunks/[id]/ api/eval/ api/health/
│  ├─ lib/
│  │  ├─ db.ts                # cached Mongo client (serverless-safe)
│  │  ├─ ingest/              # parse → normalise → chunk → embed → store
│  │  ├─ retrieve/            # vector, lexical, fuse, diversify, rerank
│  │  ├─ generate/            # prompts, structured output, verifier, state machine
│  │  ├─ providers/           # voyage.ts, gemini.ts, interfaces
│  │  └─ eval/
│  └─ components/             # SourceList, ChatPanel, EvidencePanel, SourceViewer, Xray
└─ tests/
```

## 4. API surface (baseline)

| Method & path | Description |
|---|---|
| `POST /api/ingest` | Multipart upload or `{url}` / `{text}` → creates `sources` doc (`status=queued`), kicks off processing. Idempotent via content hash. |
| `POST /api/ingest/seed` (admin) | Load sample corpus into a workspace. |
| `GET /api/sources?workspaceId=` | List sources with status. |
| `GET /api/sources/:id` | Source detail incl. chunk boundaries. |
| `DELETE /api/sources/:id` | Remove source + chunks. |
| `POST /api/query` | `{workspaceId, question, filters?, mode?}` → streams events: `trace`, `token`, `claims`, `final` (see RAG_SPEC §7). |
| `GET /api/chunks/:id?context=1` | Chunk + neighbours for the source viewer highlight. |
| `POST /api/eval/run` (admin) | Run eval set with a named config. |
| `GET /api/eval/runs` | Latest runs + deltas. |
| `GET /api/health` | DB + provider ping (used by uptime checks and README). |

## 5. Ingestion requirements
- Pipeline: **fetch/parse → clean → section detect → chunk → embed (batched) → store → status=searchable**.
- **Idempotency:** `contentHash` unique per workspace; re-uploading doesn't duplicate.
- **Resilience:** per-source status machine with retries (3x exponential backoff) on embedding API errors; failures recorded in `sources.error`.
- **Serverless constraint:** processing a source must fit in function time limits **(verify current Vercel Hobby limits)**; if not, process in resumable batches (`status=embedding`, `progress=n/m`) triggered by client polling or a follow-up call. Keep seed corpus small and **pre-embedded at seed time**.
- **Limits:** max file 10 MB, max 20 sources/workspace in sandbox, allowed types whitelist.
- **Provenance:** keep original bytes/text + `origin` (url/file name), `license`, `fetchedAt`.

## 6. Retrieval requirements (summary — details in RAG_SPEC.md)
- Hybrid = vector top-N (N≈40) + lexical top-N (N≈40) → RRF → source-diversified top-k (k≈8–12) → optional rerank → context pack.
- Filters (`workspaceId` mandatory) pushed down into `$vectorSearch.filter` and `$search.compound.filter`.
- Latency budget: retrieval ≤ 800 ms p50; end-to-end first token ≤ 3 s p50.
- Return a **trace** per chunk: ranks and scores from each stage.

## 7. Generation requirements
- Structured output (JSON schema): `state`, `answer_sections[]`, `claims[]` (`text`, `chunkIds[]`, `quote`), `conflicts[]`, `gaps[]`.
- Server-side **verifier** checks each `quote` is a (normalised) substring of the cited chunk text; unverified claims are removed or flagged.
- Pre-generation **sufficiency gate** (score thresholds + coverage) can short-circuit to `INSUFFICIENT` without calling the LLM.
- Temperature low (≤0.2). Max output tokens capped.
- Prompt-injection hygiene: treat retrieved text as data, not instructions; never execute instructions found in sources.

## 8. Non-functional requirements
| Category | Requirement |
|---|---|
| Security | Secrets server-side only; `.env*` git-ignored; admin endpoints token-guarded; upload type/size checks; no secrets in logs/video/PPT. |
| Privacy | No personal data in seed corpus; free-tier LLM terms may allow data use → don't upload private data (see SETUP_GUIDE). |
| Reliability | `/api/health`; graceful degradation (if rerank/LLM fails → show retrieved evidence with an error banner, never a blank screen). |
| Performance | Cached Mongo client; projections exclude embeddings from reads; indexes for every hot query. |
| Cost | Embed once, cache by `contentHash`; cap context tokens; cap queries per IP. |
| Accessibility | Keyboard-navigable citations, contrast AA, ARIA live region for streaming answer. |
| Observability | `queries` collection logs latency per stage, tokens, retrieved IDs, state. |
| Reproducibility | `npm run setup && npm run seed && npm run eval` from a clean clone with only `.env` supplied. |

## 9. Testing strategy
1. **Unit:** chunker (boundaries, overlap), RRF, verifier (substring/normalisation), state machine.
2. **Retrieval eval:** `data/eval/cases.json` (≥12 cases: single-source, multi-source, exact-token, conflict, unanswerable, filtered). Metrics: recall@k (source level), MRR, state accuracy, citation-verification rate. Compare configs: vector-only vs hybrid vs hybrid+rerank; chunk size A vs B.
3. **E2E smoke:** scripted run of the demo flow against the deployed URL (curl or Playwright).
4. **Pre-submission:** fresh-browser + mobile check on public URL; cold-start check.

## 10. Deployment requirements
- Production on public URL **before hour 3**, redeployed continuously; final tagged release `submission-v1`.
- Env vars set in hosting dashboard; Atlas network access allows the host (see SETUP_GUIDE).
- Seed data present in production DB; demo workspace read-only.
- Post-deadline: **no pushes, no redeploys, no env changes that alter behaviour** (code freeze). Disable Dependabot/auto-commit bots.
- Fallback: keep a screenshot/short clip in the deck in case of venue Wi-Fi issues (does not replace the live URL).

## 11. Open technical decisions (agent to resolve & log)
1. Chunking strategy (structure-aware vs fixed-size) per corpus type.
2. Whether to enable Automated Embedding (needs M10+) or self-managed Voyage embeddings.
3. Native `$rankFusion` vs app-side RRF.
4. Rerank: worth the latency?
5. Which modality beyond text (if any).
6. Auth: open demo vs passcode.
7. Whether to run ingestion inline or as resumable batches.

## 12. Decision Log
| Date/time | Decision | Reason |
|---|---|---|
| | | |
