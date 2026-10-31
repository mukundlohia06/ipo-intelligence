# START HERE — UNCHARTED 2026 · Track 2 (RAG Engine) Baseline Kit

> This kit is a **baseline**, not a spec carved in stone. The coding agent is free to brainstorm, challenge, and change anything — as long as the **Hard Constraints** below stay satisfied and the changes are written back into the docs.

## 0. The one thing you don't know yet
The official **problem statement is assigned at exactly 9:00 PM on 30 Oct 2026**. These docs are therefore **problem-statement-agnostic**: they define a reusable, domain-agnostic *Evidence Engine* (ingest → hybrid retrieve → grounded answer with verified citations → handle hard cases). At 9 PM you fill in `docs/PS_INTAKE.md`, and the agent fits the domain to it.

## 1. Hard constraints (digest of both PDFs)

### From the UNCHARTED 2026 Rulebook
| # | Constraint |
|---|---|
| H1 | Team of **exactly 3** SVNIT students. |
| H2 | Build window: **30 Oct 9:00 PM → 31 Oct 9:00 PM IST**. Project code must be built inside it. Disclose pre-existing code/templates/datasets if asked. **Do not write project code before 9 PM.** |
| H3 | Must follow the assigned problem statement + any constraints announced by organizers. |
| H4 | **Live deployment is compulsory** (public URL judges can test). A local-run video does NOT count. |
| H5 | Submission = team details, project overview, **deploy URL, GitHub repo + clear README, demo video ≤ 7 min, PPT deck, access instructions/test credentials**. |
| H6 | Submission form opens 31 Oct 9 PM, **closes 10 PM IST**. Late/incomplete/inaccessible = penalised or ineligible. |
| H7 | **Code freeze after the deadline**: no commits, no feature changes, no bug fixes, no deployed-app changes. Only presentation prep is allowed. |
| H8 | AI coding assistants only per the organizers' AI-use policy (confirm it!). Team stays responsible for understanding/testing the code. |
| H9 | **Never expose** API keys, passwords, secrets, private user data in repo, PPT, or video. |
| H10 | Permission/attribution for every third-party asset, dataset, model, font. No plagiarism. |
| H11 | MongoDB / n8n are **not mandatory unless organizers state it**. (Track 2 itself is built around MongoDB, so we default to it.) |
| H12 | Judging (Round 1): Innovation 20 · Technical implementation 25 · Functionality & deployment 25 · Problem relevance & impact 20 · Demo & docs 10. |
| H13 | Finals: Top 16, in person, 1 Nov, 10 min presentation + 2 min Q&A (architecture, code, tech choices, limitations, contributions). |

### From the MongoDB Student Hackathon – Track 2 brief
| # | Constraint |
|---|---|
| T1 | Source a **focused collection** (docs, webpages, images, transcripts, structured records; public, own, or LLM-generated). |
| T2 | **Retrieve evidence from more than one source or section**, then answer / compare / recommend / investigate / generate an artefact. |
| T3 | **Show the source behind every important result.** Citations must open to the **exact passages / source items** used. |
| T4 | Handle **at least one weak, conflicting, or unanswerable request** clearly. |
| T5 | Show **how a user adds/imports a small collection and how it becomes searchable.** |
| T6 | MongoDB: store original sources, chunks, embeddings, metadata, source IDs **together**; **Vector Search** for semantic retrieval; **metadata filters**; **hybrid search** where exact names/codes matter; keep a **small test set of requests + expected source IDs** to compare retrieval changes. |
| T7 | Same embedding model for content and queries; index dims must match the model. |
| T8 | Be ready to explain architecture, data model, and choices. Coding agents are allowed. |
| T9 | Focus on **one user workflow, end to end**. Keep the input set small; make setup repeatable. |

## 2. File map
Put `AGENTS.md` at the repo root and everything else in `/docs` (copy `AGENTS.md` into `.agent/rules/` too for Antigravity).

| File | Purpose |
|---|---|
| `START_HERE.md` | This file. Constraints + kickoff prompt. |
| `docs/PS_INTAKE.md` | Fill at 9 PM with the real problem statement. Drives all decisions. |
| `docs/PRD.md` | What & why: users, requirements, acceptance criteria, scope. |
| `docs/TRD.md` | How: stack, APIs, env vars, NFRs, repo layout, open decisions. |
| `docs/ARCHITECTURE.md` | Components, data flows, sequence diagrams, failure modes. |
| `docs/DATA_MODEL.md` | MongoDB collections, schemas, indexes (vector, lexical, TTL, unique). |
| `docs/RAG_SPEC.md` | Chunking, retrieval, fusion, rerank, citation verification, hard cases, eval harness. |
| `docs/DESIGN.md` | UX/UI spec, screens, citation UI, states, demo mode. |
| `docs/PLAN.md` | 24-hour schedule, roles for 3 people, cut list, git rules. |
| `docs/SUBMISSION.md` | Submission checklist, README template, video script, PPT outline, Q&A prep. |
| `docs/SETUP_GUIDE.md` | Antigravity + every account/auth you need (do this BEFORE 9 PM). |
| `AGENTS.md` | Standing rules for the coding agent. |
| `.env.example` | Env var template. |

## 3. Kickoff prompt (paste into Antigravity at 9:00 PM, after filling `docs/PS_INTAKE.md`)

```text
You are the lead engineer on a 24-hour hackathon build (UNCHARTED 2026, Track 2: RAG Engine).
Read, in order: AGENTS.md, START_HERE.md, docs/PS_INTAKE.md, docs/PRD.md, docs/TRD.md,
docs/ARCHITECTURE.md, docs/DATA_MODEL.md, docs/RAG_SPEC.md, docs/DESIGN.md, docs/PLAN.md,
docs/SUBMISSION.md.

These docs are a BASELINE. You may brainstorm, challenge, and change anything except the
Hard Constraints in START_HERE.md. Do NOT start coding yet. First produce:

1. A 10-line summary of the problem statement and how our product answers it.
2. 3 candidate product concepts that fit the PS and Track 2 (one "safe", one "ambitious",
   one "weird but memorable"), with a recommendation and why it scores well against the
   judging rubric (innovation 20 / technical 25 / functionality+deployment 25 / relevance 20 / demo 10).
3. The corpus plan: which sources, how many, where they come from, licensing, and how
   the multi-source + conflicting/unanswerable cases will be demonstrated.
4. Any changes you propose to the stack, data model, or scope — with reasons.
5. A task breakdown for 3 parallel workstreams (backend/RAG, frontend, infra/eval/docs)
   with the first deployable "hello world" as milestone 0.

Wait for my approval of the concept, then update the docs with the decisions
(append a "Decision Log" to docs/PRD.md) and begin Milestone 0: deploy a public skeleton
that connects to MongoDB Atlas BEFORE building features.
```

## 4. Golden rules (memorise)
1. **Deploy a skeleton in the first 2 hours** and keep it deployed. Deployment is worth 25% and is a hard requirement.
2. **One workflow, end to end, polished** beats five half-working features.
3. Every answer shows **clickable citations to exact passages**. No citation → no claim.
4. The **"I can't answer that / sources conflict"** behaviour is a feature to showcase, not an edge case.
5. Keep a **retrieval test set with expected source IDs** and show the numbers.
6. Last commit by ~8:30 PM on 31 Oct. Tag it. Then submit. Then touch nothing.
