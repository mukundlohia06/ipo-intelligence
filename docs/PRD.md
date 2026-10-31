# PRD — Evidence Engine (working title; rename after PS intake)

**Hackathon:** UNCHARTED 2026 (NEXUS × SVNIT) · **Track:** 2 — RAG Engine (MongoDB Student Hackathon)
**Status:** BASELINE v0.1 — agent may revise. Keep a **Decision Log** at the bottom.

---

## 1. Vision
A product that turns a small, focused body of source material into **grounded, inspectable results** — answers, comparisons, recommendations, or generated artefacts — where **every important claim links to the exact passage it came from**, and where the system **admits when evidence is weak, conflicting, or missing**.

> Tagline candidates: "Trust, but click." · "Every claim has a receipt." · "Answers with receipts."

## 2. Problem
People who must decide from many documents (policies, reports, logs, manuals, papers, records) either (a) read everything manually, or (b) use chatbots that sound confident but can't show where an answer came from, blend conflicting sources silently, and hallucinate when evidence is missing.

*(Replace/sharpen with the real problem statement from `PS_INTAKE.md`.)*

## 3. Target users & jobs-to-be-done
| Persona | Job | Pain today |
|---|---|---|
| **Analyst / Reviewer** (primary) | "Give me an evidence-backed answer/brief from these N documents." | Slow, error-prone cross-document reading. |
| **Skeptical stakeholder** | "Prove it. Show me the passage." | No traceability. |
| **Judge / Demo viewer** | "Does it work live? Can I break it?" | Hackathon demos that only work on the happy path. |

*(Specialise personas to the PS domain.)*

## 4. The one end-to-end workflow (Track-2 "demo flow")
1. **Import** — user adds a small collection (upload files / paste URLs / load a seeded sample set). The UI shows each source moving through *queued → parsed → chunked → embedded → searchable*.
2. **Ask** — user submits a request that needs evidence from **≥2 sources or distant sections**.
3. **Answer** — streaming answer with inline numbered citations `[1][2]`; an **Evidence panel** lists sources and the **exact passages** (highlighted spans) used.
4. **Inspect** — user opens a citation → source viewer scrolls to and highlights the passage; "Why was this retrieved?" shows retrieval trace (vector score, keyword score, fused rank, rerank score, filters).
5. **Break it** — user asks a **weak / conflicting / unanswerable** question; system responds with an explicit state: *Insufficient evidence*, *Conflicting sources* (shows both sides), or *Partial answer* (what is and isn't supported).

## 5. Goals & non-goals
**Goals**
- G1: Verifiable grounding — ≥95% of emitted claims map to a retrievable passage (verified programmatically).
- G2: Multi-source reasoning visible in the UI.
- G3: Graceful refusal / conflict handling as a showcased feature.
- G4: Repeatable setup: one command seeds the demo corpus + creates indexes.
- G5: Measurable retrieval quality via a small eval set (expected source IDs).
- G6: Public, stable deployment judges can use without help.

**Non-goals (v1)**
- Multi-tenant enterprise auth, billing, huge-scale ingestion, fine-tuning models, perfect OCR, mobile apps.

## 6. Functional requirements
Priority: **P0** = must ship, **P1** = should ship, **P2** = stretch.

### Ingestion & library
| ID | Requirement | Pri |
|---|---|---|
| FR-1 | Add sources via file upload (PDF, MD, TXT, HTML, CSV/JSON as records) and URL import. | P0 |
| FR-2 | One-click **Load sample corpus** (seeded, licensed/synthetic) into the user's workspace. | P0 |
| FR-3 | Per-source ingestion status with timestamps and error messages. | P0 |
| FR-4 | Store original source, parsed text, chunks, embeddings, metadata, source IDs together in MongoDB. | P0 |
| FR-5 | Metadata extraction (title, type, date, author/owner, version, custom domain fields). | P1 |
| FR-6 | Source detail view with full text and chunk boundaries visible. | P1 |
| FR-7 | Image/transcript/structured-record source types (pick ≥1 non-PDF modality if PS rewards it). | P2 |

### Retrieval
| ID | Requirement | Pri |
|---|---|---|
| FR-8 | Semantic retrieval via MongoDB Vector Search. | P0 |
| FR-9 | Metadata filters (source type, date range, owner/tag, source IDs) applied *inside* retrieval. | P0 |
| FR-10 | **Hybrid** retrieval (lexical + vector) with rank fusion; exact IDs/names/codes must be findable. | P0 |
| FR-11 | Multi-source coverage: retrieval diversifies across sources/sections (not top-k from one doc). | P0 |
| FR-12 | Optional rerank step. | P1 |
| FR-13 | Retrieval trace + `explain` view for debugging. | P1 |

### Generation & grounding
| ID | Requirement | Pri |
|---|---|---|
| FR-14 | Answer is generated **only** from retrieved passages, as structured output: claims → citation chunk IDs + supporting quote. | P0 |
| FR-15 | **Citation verification**: each quoted span must exist in the cited chunk; unverifiable claims are dropped or flagged. | P0 |
| FR-16 | Citations open the exact passage in context (highlighted). | P0 |
| FR-17 | Answer states: `ANSWERED`, `PARTIAL`, `CONFLICTING`, `INSUFFICIENT`. UI renders each distinctly. | P0 |
| FR-18 | Output modes appropriate to the PS (e.g., Q&A, comparison table, risk brief, checklist). At least 2. | P1 |
| FR-19 | Streaming responses. | P1 |
| FR-20 | Conflict detection: surface contradictory passages side-by-side with source + date. | P1 |

### Evaluation & observability
| ID | Requirement | Pri |
|---|---|---|
| FR-21 | `eval_cases` collection: question, expected source IDs (and optionally chunk IDs), expected state. | P0 |
| FR-22 | Eval runner prints recall@k, MRR, "expected state accuracy"; stores runs; compares two configs. | P0 |
| FR-23 | In-app Eval page showing latest run and delta vs previous. | P1 |
| FR-24 | Query log with latency, tokens, retrieved IDs (for the demo + debugging). | P1 |

### Platform
| ID | Requirement | Pri |
|---|---|---|
| FR-25 | Public deployment; no login needed for judges **or** a shared demo credential documented. | P0 |
| FR-26 | Session-scoped sandbox workspace for uploads with TTL cleanup; pre-seeded read-only demo workspace. | P1 |
| FR-27 | Basic abuse guards: file size/type limits, per-IP rate limit, max tokens. | P0 |
| FR-28 | Optional n8n workflow (webhook/scheduled import) as sponsor integration. | P2 |

## 7. Acceptance criteria (demo-driven)
- **AC-1 Import:** From an empty workspace, loading the sample corpus yields "searchable" status for all sources in < 90 s.
- **AC-2 Multi-source:** Seeded question Q-multi returns an answer citing ≥2 distinct sources; Evidence panel shows exact passages.
- **AC-3 Exactness:** Clicking any citation highlights text that **literally appears** in the stored source.
- **AC-4 Exact-token:** Seeded query containing a code/ID/name returns the right chunk in top-3 (hybrid beats vector-only in eval — show numbers).
- **AC-5 Conflict:** Seeded conflicting pair yields `CONFLICTING` with both passages shown.
- **AC-6 Unanswerable:** Seeded out-of-corpus question yields `INSUFFICIENT` and **no fabricated citation**.
- **AC-7 Eval:** `npm run eval` prints metrics for ≥12 cases; two configs comparable.
- **AC-8 Deploy:** A fresh browser on a phone can complete AC-2 on the public URL.
- **AC-9 Repro:** `README` setup (clone → env → `npm run setup` → run) works from scratch.

## 8. Differentiators (pick 1–2 and polish; don't do all)
1. **Receipts View** — every sentence hover-links to its verified quote.
2. **Retrieval X-ray** — shows vector rank vs keyword rank vs fused vs rerank per chunk; makes the MongoDB usage legible to judges.
3. **Conflict Radar** — contradictions between sources/versions highlighted automatically.
4. **Eval-in-the-loop** — config change → instant recall@k delta, displayed in the UI.
5. **Artefact generation** — exports a cited brief (Markdown/PDF) with a source appendix.

## 9. Success metrics
| Metric | Target |
|---|---|
| Recall@5 on eval set (expected sources) | ≥ 0.85 |
| Citation verification pass rate | ≥ 95% |
| Correct state on hard-case set | 100% on seeded cases |
| p50 time-to-first-token | < 3 s |
| Public URL uptime during judging | 100% |

## 10. Judging alignment
| Rubric (weight) | What we show |
|---|---|
| Innovation 20% | Differentiator(s) from §8, domain-specific twist from PS. |
| Technical 25% | Hybrid retrieval + fusion, citation verifier, eval harness, clean data model. |
| Functionality & deployment 25% | Live URL, seeded data, error handling, rate limits, fast. |
| Relevance & impact 20% | Tight mapping to PS persona + quantified benefit. |
| Demo & docs 10% | 7-min scripted video, README, deck, architecture diagram. |

## 11. Risks & mitigations
| Risk | Mitigation |
|---|---|
| Embedding/LLM rate limits (free tiers) | Batch + retry/backoff; cache embeddings; pre-embed seed corpus; provider abstraction with fallback. |
| Deployment timeouts on serverless | Chunked ingestion jobs; keep demo corpus small; streaming responses. |
| Atlas free tier limits (storage, index count) | Small corpus; consolidate indexes; know the limits (see SETUP_GUIDE). |
| Hallucinated citations | Structured output + verifier + drop unverifiable claims. |
| Scope creep | P0 only until Milestone 4; cut list in PLAN.md. |
| Secret leakage | `.env` in `.gitignore`, secret scanning, server-only keys. |
| Judges can't access app | Public URL, no-login demo path, access instructions in README + form. |

## 12. Open questions for the agent (resolve after PS intake)
1. Which concept best fits the PS and gives a memorable demo?
2. Which non-text modality (if any) is worth it?
3. Best output artefact for the persona?
4. Which domain metadata unlocks meaningful filters?

## 13. Decision Log (append as you go)
| Date/time | Decision | Reason |
|---|---|---|
| | | |
