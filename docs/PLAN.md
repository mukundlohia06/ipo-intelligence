# PLAN — 24-Hour Execution Plan (30 Oct 9:00 PM → 31 Oct 9:00 PM IST)

**Reality check:** the submission form opens 9 PM on 31 Oct and closes **10 PM**. Treat **8:30 PM** as your real code freeze and finish video/deck/README **before** 9 PM so the last hour is only form-filling and link-checking.

## 1. Team roles (3 people — rotate as needed)
| Role | Owns | Main deliverables |
|---|---|---|
| **A — RAG/Backend lead** | Ingestion, retrieval, fusion, generation, verifier, Mongo indexes | `lib/ingest`, `lib/retrieve`, `lib/generate`, `scripts/setup-db.ts` |
| **B — Frontend/UX lead** | UI, streaming, citation viewer, X-ray, demo mode | `components/*`, pages, design polish |
| **C — Infra/Eval/Docs lead** | Deploy, env/secrets, seed corpus, eval set + runner, README, video, deck | Vercel + Atlas, `data/*`, `scripts/eval.ts`, submission pack |

Everyone: can explain the whole architecture (finals Q&A covers architecture, code, choices, limitations, contributions).

## 2. Schedule
| Time (IST) | Hours | Milestone | Exit criteria |
|---|---|---|---|
| Sat… **Fri 30 Oct 9:00 PM** | 0:00 | **PS released** | Paste into `PS_INTAKE.md`; confirm AI-use policy. |
| 9:00–10:00 PM | 0–1 | **M-1 Concept lock** | Agent proposes 3 concepts; team picks; decisions logged in PRD. |
| 10:00 PM–12:00 AM | 1–3 | **M0 Skeleton deployed** | Public URL live; connects to Atlas; `/api/health` green; env vars set; repo pushed. |
| 12:00–3:00 AM | 3–6 | **M1 Ingest + corpus** | Upload/seed works; chunks + embeddings stored; indexes created; sources reach `searchable`. Corpus drafted (incl. planted conflict/gap). |
| 3:00–6:00 AM | 6–9 | **M2 Retrieval v1** | Hybrid retrieval + filters + trace endpoint; eval set v1 (≥12 cases) running. *Sleep shifts start (see §4).* |
| 6:00–10:00 AM | 9–13 | **M3 Grounded answers** | Structured generation + verifier + states; citations open exact passages. |
| 10:00 AM–2:00 PM | 13–17 | **M4 Full demo flow (P0 complete)** | All AC-1…AC-9 pass on the **deployed** app. Tag `m4-p0-complete`. |
| 2:00–5:00 PM | 17–20 | **M5 Differentiators + tuning** | 1–2 differentiators; eval-driven tuning; rate limits; error states; mobile check. |
| 5:00–7:00 PM | 20–22 | **M6 Polish + docs** | README final, architecture diagram, seed data verified in prod, demo video recorded. |
| 7:00–8:30 PM | 22–23.5 | **M7 Freeze** | Final prod smoke test; tag `submission-v1`; **last commit**; PPT final; video uploaded; links tested. |
| 8:30–9:00 PM | 23.5–24 | Buffer | Fix *only* showstoppers; otherwise stop touching code. |
| **9:00–10:00 PM** | — | **Submit** | Form complete; every link opened from an incognito window; confirmation saved. |

## 3. First 3 hours in detail
**Hour 0–1 (9–10 PM):** fill `PS_INTAKE.md` → run kickoff prompt → pick concept → decide corpus → split work.
**Hour 1–3 (10 PM–12 AM):**
- A: `setup-db.ts` (collections, validators, indexes), Mongo client, provider interfaces, a single embed+store round trip.
- B: Next.js shell, layout with three panes, landing, mock data for citation UI.
- C: GitHub repo + Vercel project + env vars + Atlas network access; `/api/health`; start corpus collection + eval case drafting.
Deploy before moving on. **If you can't deploy by hour 3, stop and fix that first.**

## 4. Energy & risk management
- Two people work while one sleeps in 3-hour shifts between ~3–9 AM; the awake pair owns merges.
- Meals/water are part of the plan. A tired team ships bugs.
- Agent quota: free-tier limits are real; share the load across teammates' accounts and keep a backup tool/model.
- Timebox every rabbit hole to 45 min, then cut or simplify.

## 5. Definition of Done (per feature)
1. Works on the **deployed** URL, not just localhost.
2. Has an error/empty state.
3. Doesn't leak secrets or embeddings to the client.
4. Eval run recorded if it touched retrieval/generation.
5. Docs/Decision Log updated if behaviour changed.

## 6. Cut list (drop in this order if behind)
1. Image/other modalities · 2. n8n integration · 3. Export-to-PDF · 4. Rerank · 5. Compare/Brief modes beyond one · 6. Eval page in UI (keep CLI) · 7. Query decomposition · 8. URL import (keep file upload + seed).
**Never cut:** deployment, hybrid retrieval, citations to exact passages, unanswerable/conflict handling, eval set with numbers, README, demo video.

## 7. Git rules
- Repo created empty before 9 PM is fine; **first project commit after 9 PM**.
- Small commits with meaningful messages (judges may read history). Trunk-based; short-lived branches; deploy from `main`.
- Never commit `.env*`. Run a secret scan (`gitleaks`/GitHub secret scanning) before the final tag.
- Disable Dependabot/auto-PR bots; no automated commits.
- Tag milestones (`m0-skeleton`, `m4-p0-complete`, `submission-v1`).
- **After the deadline: no commits, no redeploys, no env changes.**

## 8. Daily stand-up cadence (10 minutes)
Every ~4 hours: what works on prod, what's blocked, eval numbers, cut decisions. Update PRD Decision Log.
