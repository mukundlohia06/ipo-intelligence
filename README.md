# IPO Intelligence — The AI Research Terminal for IPO Investors

> **UNCHARTED 2026** (NEXUS × SVNIT Surat) · **Track 2: RAG Engine (MongoDB Student Hackathon)**  
> Built by: Mukund Lohia & Team  
> Core Technologies: **MongoDB Atlas Vector Search**, **Atlas Search (BM25)**, **FastAPI**, **Next.js 14+**, **PyMuPDF**, **Google Gemini**

---

## 1. Project Overview

**IPO Intelligence** is an evidence-first AI research terminal built specifically for Indian IPO due diligence. When analyzing an Indian Initial Public Offering (IPO), investors are forced to navigate 500+ page Draft Red Herring Prospectuses (DRHP), restated financial statements, valuation metrics, and market hype.

Generic AI chatbots hallucinate financial figures and invent citations. **IPO Intelligence solves this through zero-hallucination, receipt-backed intelligence:**

* **Every Claim Has a Receipt:** Every factual claim emitted by the AI is strictly verified against underlying source chunks and deep-links directly to the exact page and highlighted sentence in the prospectus.
* **Deterministic Financial Engine:** Financial ratios (P/E, EV/EBITDA, Net Profit Margins, Debt-to-Equity, Cash Flow from Operations) are computed deterministically via Python code—never generated as probabilistic guesses by an LLM.
* **Contradiction Radar:** When external brokerage reports or marketing statements contradict audited DRHP restated cash flows, the terminal flags the divergence in a dedicated `CONFLICTING` card.
* **Honest Abstention:** When evidence is insufficient or speculative (e.g. guaranteed listing premiums), the system explicitly refuses to guess and triggers `INSUFFICIENT EVIDENCE`.

---

## 2. Architecture & Technology Stack

```
Next.js 14+ (App Router)
   │ (REST / SSE Streaming)
   ▼
FastAPI Backend (Python 3.11+)
   │
   ├── PyMuPDF (C-Engine PDF Parsing & Structure-Aware Chunking)
   ├── Citation Verifier (Deterministic Quote-in-Chunk Verification)
   ├── Financial Engine (Deterministic Ratios & Scorecard Calculations)
   │
   ▼
MongoDB Atlas (M0 / M10)
   ├── Collection: 'ipos' (Offer details & 5-dimension scorecard)
   ├── Collection: 'sources' (Prospectuses, reports, SHA-256 hashes)
   ├── Collection: 'chunks' (Text passages & embeddings)
   │     ├── Vector Search Index: 'chunks_vector' (Cosine similarity)
   │     └── Lexical Search Index: 'chunks_text' (Lucene BM25)
   ├── Collection: 'financials' (Audited multi-year restated metrics)
   ├── Collection: 'market_data' (GMP & QIB/NII/Retail subscriptions)
   ├── Collection: 'peers' (Listed sector competitor benchmarks)
   ├── Collection: 'queries' (Observability & retrieval latency log)
   └── Collection: 'eval_cases' & 'eval_runs' (Evaluation harness)
```

### Technology Highlights
* **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, Recharts, Lucide React
* **Backend:** FastAPI, Pydantic v2, PyMongo, PyMuPDF (`fitz`), Google GenAI SDK
* **Database & Search:** MongoDB Atlas, Vector Search (`$vectorSearch`), Atlas Search (`$search`), Reciprocal Rank Fusion ($k=60$)
* **AI Providers:** Google Gemini 1.5 Flash (Structured JSON output), `text-embedding-004` / Voyage AI (Dense embeddings)

---

## 3. Core Product Modules

1. **IPO Explorer Terminal:** Real-time overview of active IPOs with 5-dimension weighted scorecards:
   - Financial Fundamentals (30%)
   - Valuation vs Peers (20%)
   - Business & Financial Risks (25%)
   - Market Sentiment & Demand (15%)
   - Listing Potential (10%)
2. **3-Pane Research Console:**
   - **Pane 1: Source Library:** Document explorer with upload progress tracking (`Queued` → `Parsed` → `Chunked` → `Searchable`).
   - **Pane 2: Research Console:** Streaming conversational terminal with pre-configured quick investigation prompts.
   - **Pane 3: Evidence & Receipts:** Verified citation cards with verbatim quotes, page numbers, and Retrieval X-Ray.
3. **Retrieval X-Ray Inspector:** Full transparency into search mechanics, revealing Vector rank, BM25 keyword score, and RRF fused rank.
4. **Interactive Passage Viewer:** One-click modal highlighting exact cited text directly inside the source document.
5. **Judges Evaluation Benchmark (`/eval`):** Live dashboard showing Recall@k, Mean Reciprocal Rank (MRR), and Citation Verification Pass Rate across curated test cases.

---

## 4. Quickstart Guide (Local Development)

### Prerequisites
- Node.js LTS (v18+)
- Python 3.11+
- MongoDB Atlas cluster URI

### 1. Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Configure backend environment
cp ../.env.example .env
# Edit .env with your MONGODB_URI and GEMINI_API_KEY

# Initialize MongoDB collections and indexes
python app/scripts/setup_db.py

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```
Backend API will be running at `http://localhost:8000` with interactive docs at `http://localhost:8000/docs`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend terminal will be available at `http://localhost:3000`.

---

## 5. Development Roadmap (24-Hour Hackathon)

- [x] **Milestone 1:** Project Skeleton, FastAPI microservice, Next.js terminal UI, health check endpoints, and Render/Vercel deployment readiness.
- [x] **Milestone 2:** MongoDB Atlas data schemas, B-tree indexes, and Search/Vector index specifications across all 9 collections.
- [ ] **Milestone 3:** Document Ingestion Engine, PyMuPDF extraction, structure-aware chunking, and seed corpus loading.
- [ ] **Milestone 4:** RAG Retrieval Engine, Hybrid RRF ($k=60$), sufficiency gate, Gemini structured generation, and quote verifier.
- [ ] **Milestone 5:** Deterministic Financial Engine, valuation metrics, and peer comparison charts.
- [ ] **Milestone 6:** 3-Pane Research Terminal, Passage Viewer with text highlights, and live upload workflow.
- [ ] **Milestone 7:** Golden Evaluation Suite (`cases.json`), live public deployment, 7-minute demo video, and code freeze.

---

## 6. Compliance & Disclaimer
*For hackathon demonstration and educational evaluation only. Not registered with SEBI as an investment advisor. Real-world investment decisions require consultation with a registered financial professional.*
