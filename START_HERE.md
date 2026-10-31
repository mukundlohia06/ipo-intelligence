# START HERE — IPO Intelligence

## Project overview
IPO Intelligence is an AI-powered IPO research terminal. It helps users investigate IPOs using official company documents and reliable financial information.

The intended product covers:
- Company business models and operations
- IPO details and objectives
- Financial performance
- Valuation and peer comparisons
- Promoter and management risks
- Litigation and contingent liabilities
- Customer and supplier concentration
- Relevant DRHP/RHP disclosures
- Evidence-backed research conclusions

## 1. Read the documentation first
Before writing application code, read these files in order:

1. `AGENTS.md`
2. `docs/PS_INTAKE.md`
3. `docs/PRD.md`
4. `docs/TRD.md`
5. `docs/ARCHITECTURE.md`
6. `docs/DATA_MODEL.md`
7. `docs/RAG_SPEC.md`
8. `docs/DESIGN.md`
9. `docs/PLAN.md`
10. `docs/SUBMISSION.md`
11. `docs/SETUP_GUIDE.md`

## 2. Understand the intended architecture
The intended architecture is:
- **Next.js:** frontend application
- **FastAPI:** backend API and business logic
- **MongoDB Atlas:** database and document/chunk metadata
- **MongoDB Vector Search:** semantic retrieval
- **MongoDB Atlas Search:** keyword retrieval
- **PyMuPDF:** PDF text extraction
- **Configurable providers:** embeddings and large language models

Keep database credentials and AI-provider secrets on the backend. The official problem statement and organizer constraints take priority if they require a change.

## 3. First Antigravity task
Do not start coding immediately.

First:
- Read the project instructions and all listed documentation.
- Understand the official problem statement and hackathon requirements.
- Identify conflicts, missing information, and risky assumptions.
- Confirm the frontend/backend architecture.
- Recommend a clean repository structure.
- Divide the implementation into small milestones.
- Wait for approval before modifying application code.

## 4. Development priorities

### Priority 1 — Working skeleton
- Frontend and backend start successfully
- MongoDB Atlas connection
- Health endpoint
- IPO dashboard and IPO exploration
- Document upload interface and API skeleton

### Priority 2 — Evidence-backed RAG workflow
- PDF text extraction
- Document chunking and metadata
- Embedding generation
- MongoDB Vector Search
- Keyword and hybrid retrieval
- Evidence-backed AI answers with source references
- Handling of weak, conflicting, and insufficient evidence

### Priority 3 — Research and submission readiness
- Financial analysis
- IPO risk intelligence
- Peer comparison
- Evaluation dashboard and test cases
- Deployment, README, and demo preparation

## Important rules
- Never fabricate financial or market data.
- Never invent citations, quotations, or source page numbers.
- Clearly distinguish verified data from demonstration data.
- Show uncertainty when evidence is insufficient or conflicting.
- Build and test one milestone at a time.
- Follow the official problem statement and participant rules.
