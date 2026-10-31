# AGENTS.md — IPO Intelligence

## Project identity
**IPO Intelligence — The AI Research Terminal for IPO Investors**

Build an evidence-first AI research platform that helps users investigate IPOs using DRHP/RHP documents, financial statements, valuation metrics, peer comparisons, and risk disclosures.

## Instructions for the AI coding agent
1. Read the project documentation in `/docs` before making architectural or implementation decisions.
2. Follow `docs/PS_INTAKE.md`. If it conflicts with other project documents, the official problem statement and organizer requirements take priority.
3. Follow the architecture documented in `docs/ARCHITECTURE.md`. Do not change the stack without explaining the reason and obtaining approval.
4. Build features incrementally. Do not attempt to implement the entire application in one step.
5. Keep frontend and backend responsibilities separate.
6. Never expose API keys, database credentials, or secrets in frontend code.
7. Do not fabricate financial figures, IPO subscription numbers, market data, citations, or research findings.
8. Clearly label sample, mock, and demonstration data.
9. Support AI-generated research conclusions with retrievable evidence, or clearly state when evidence is insufficient.
10. Preserve source-document references and page information wherever available.
11. Prefer readable, modular, maintainable code over unnecessary complexity.
12. Add input validation, error handling, and loading states.
13. Run relevant tests after implementation and report actual results. Never claim a test passed unless it was run.
14. Inspect existing code before changing it. Avoid overwriting working code unnecessarily.

## Intended technology stack

### Frontend
- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Recharts
- Lucide React

### Backend
- Python
- FastAPI
- Pydantic
- PyMongo
- PyMuPDF

### Database and retrieval
- MongoDB Atlas
- MongoDB Vector Search
- MongoDB Atlas Search

### Deployment
- Vercel for the frontend
- Render or an equivalent platform for the backend

## Core product principles
- Evidence-first research
- Transparent citations
- Reliable, reproducible financial calculations
- Clear risk identification
- Explainable AI responses
- Honest uncertainty handling
- No fabricated data

## Development workflow
Before implementing a feature:
1. Understand the requirement and acceptance criteria.
2. Inspect the existing code and relevant documentation.
3. Identify affected files and dependencies.
4. Propose a small implementation plan.
5. Implement the feature.
6. Run relevant tests, type checks, and build checks.
7. Summarise files changed, checks performed, results, and remaining issues.

Do not mark a feature complete until it is implemented and tested.
