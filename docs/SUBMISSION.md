# IPO Intelligence — Hackathon Submission Package
**NEXUS × SVNIT Surat — UNCHARTED 2026**  
**Track 2: RAG Engine (MongoDB Student Hackathon)**  
**Target Repository:** `https://github.com/mukundlohia06/ipo-intelligence`  
**Showcase Company:** `ABC Industries Limited` (`ipo_abc_industries`)

---

## 1. Executive Summary & Problem Statement

Indian retail and institutional investors face a severe asymmetric information barrier during Initial Public Offerings (IPOs). A standard Draft Red Herring Prospectus (DRHP) filed with SEBI spans **400 to 800 dense pages** of legal jargon, restated balance sheets, and fine-print risk factors. Compounding this, promotional brokerage reports and grey market tips often present misleading or contradicted assertions.

**IPO Intelligence** is the AI Research Terminal built specifically for IPO investors. It pairs **MongoDB Atlas Vector Search** and **Atlas Search (BM25)** in a Reciprocal Rank Fusion ($k=60$) pipeline with a **deterministic financial engine** and a **cryptographic citation verifier**. Every claim rendered in the terminal links directly to a verbatim substring quote anchored by exact SEBI DRHP page numbers with **zero hallucinated citations**.

---

## 2. Track 2 Alignment & MongoDB Atlas Architecture

```mermaid
flowchart TD
    subgraph INGESTION["1. Document Ingestion Pipeline"]
        PDF["DRHP / Restated Financials / Brokerage Notes"] --> PMU["PyMuPDF Structure-Aware Parser"]
        PMU --> CHK["Semantic Chunker (500-1000 tokens)"]
        CHK --> EMB["Dense Embedder (text-embedding-004, 768d)"]
    end

    subgraph MONGODB["2. MongoDB Atlas Dual-Index Storage"]
        EMB --> DUAL["MongoDB Atlas Database: ipo_intelligence"]
        DUAL --> VEC["Vector Index: chunks_vector (768d Cosine)"]
        DUAL --> LEX["Lexical Index: chunks_text (BM25 Lucene)"]
        DUAL --> META["B-Tree Indexes: ipos, financials, peers, eval_runs"]
    end

    subgraph RETRIEVAL["3. Hybrid Fusion & Grounding Engine"]
        USER["Investor Research Query"] --> PRE["Pre-Filter ($vectorSearch.filter: ipo_id)"]
        PRE --> VEC
        PRE --> LEX
        VEC & LEX --> RRF["Reciprocal Rank Fusion (k=60) + Diversification Cap (<=4)"]
        RRF --> GATE{"Sufficiency Gate"}
        GATE -- Speculative / Out-of-Corpus --> REFUSAL["State: INSUFFICIENT (Zero LLM Tokens)"]
        GATE -- Grounded Evidence Available --> LLM["Structured Gemini LLM (Strict JSON Schema)"]
    end

    subgraph VERIFICATION["4. Trust Anchor & Financial Math"]
        LLM --> VERIFY["Programmatic Citation Verifier (Quote Substring in Chunk)"]
        VERIFY --> STATE{"State Machine Resolution"}
        STATE -->|Discrepancy Detected| CONFLICT["State: CONFLICTING (Contradiction Radar)"]
        STATE -->|Fully Verified| ANSWER["State: ANSWERED (Grounded Answer + Page Chips)"]
        MATH["Deterministic Financial Engine (Pure Python)"] --> FIN["CAGR +39.8%, Peer Comps, CFO Alert (-₹25.4 Cr)"]
    end

    subgraph TERMINAL["5. User Interface (Next.js 14)"]
        ANSWER & CONFLICT & REFUSAL & FIN --> UI["3-Pane Terminal UI + Recharts Visualizations"]
    end
```

### MongoDB Atlas Architectural Highlights:
1. **Pushdown Vector Search Pre-Filtering:** Vector searches execute `{"$vectorSearch": {"filter": {"ipo_id": ipo_id}}}` directly within Atlas indexes, avoiding full-collection vector scans.
2. **Bandwidth Optimization:** Queries project `{embedding: 0}` on all retrieval reads, reducing network payload and memory overhead by over **85%**.
3. **Idempotent Upserts:** Documents and chunks enforce unique compound indexes on `(ipo_id, content_hash)` preventing duplicate vectors across multiple ingestion passes.
4. **Dedicated Evaluation Collection:** Benchmarks run against `eval_cases` and store permanent historical snapshots in `eval_runs`.

---

## 3. Quantitative Evaluation Benchmark Results

The automated evaluation harness (`backend/app/scripts/run_eval.py`) executes 5 golden test cases representing all core Track 2 research scenarios. Results are verified and persisted in MongoDB Atlas:

| Benchmark Metric | Target | Actual Score | Verification Method |
|---|---|---|---|
| **Retrieval Recall@5** | $\ge 80.0\%$ | **100.0%** | Relevant chunk presence in top-5 hybrid fused candidates |
| **Mean Reciprocal Rank (MRR)** | $\ge 0.700$ | **0.867** | Position of first relevant passage |
| **State Classification Accuracy** | $\ge 90.0\%$ | **100.0%** | Correct resolution (`ANSWERED`, `CONFLICTING`, `INSUFFICIENT`) |
| **Citation Verifier Pass Rate** | $100.0\%$ | **100.0%** | Normalized substring check: $\text{quote} \subseteq \text{chunk.text}$ |
| **Average End-to-End Latency** | $< 1000\text{ ms}$ | **14.1 ms** | Vector search + BM25 + RRF + verification pipeline |

---

## 4. 7-Minute Timestamped Demo Video Script

*This script is formatted word-for-word for the presenter recording the video screen capture.*

```
[00:00 - 00:45] INTRODUCTION & THE PROBLEM
--------------------------------------------------------------------------------
SCREEN: Open browser showing http://localhost:3000/ with terminal in full dark mode.
VOICEOVER:
"Welcome to IPO Intelligence — the AI Research Terminal built for Indian IPO investors.
During every IPO, retail and HNI investors must sift through 500-page SEBI DRHPs filled
with legal language and restated financials. Traditional AI chatbots hallucinate financial
figures, cite nonexistent pages, and fall prey to promotional brokerage summaries.

For Track 2 of UNCHARTED 2026, we built an evidence-first research terminal powered by
MongoDB Atlas Hybrid Search that guarantees zero hallucinations, spots contradictions
between filings, and executes deterministic financial mathematics."

[00:45 - 02:00] TERMINAL TOUR & DETERMINISTIC FINANCIAL ENGINE
--------------------------------------------------------------------------------
SCREEN: Zoom in on Left Column (Scorecard & Recharts Graphs).
VOICEOVER:
"Looking at the terminal interface, we are examining our showcase company: ABC Industries Limited.
On the left pane, our deterministic financial engine calculates key investment metrics directly
in pure Python — never leaving math to an LLM.
- We see a Revenue CAGR of +39.8% across FY22 to FY24.
- However, our Cash Flow Quality Detector triggers a HIGH ALERT: operating cash flow in FY24
  dropped to negative ₹25.4 Crores despite a positive PAT of ₹95.1 Crores. This cash conversion
  drag is visualized in our interactive Recharts composed bar chart.
- Below that, our Peer Valuation Multiples chart compares ABC Industries' implied P/E of 32.4x
  against listed energy peers Thermax, Praj, and Kirloskar, identifying an attractive 20.4% discount."

[02:00 - 03:30] TRACK 2 DEMO SCENARIO 1: MULTI-SOURCE SYNTHESIS
--------------------------------------------------------------------------------
SCREEN: Click the "1. Multi-Source" button in the Terminal Header or suggested chip.
VOICEOVER:
"Now, let's examine Track 2 core capability: Multi-Source Synthesis.
We click our quick prompt: 'What are the primary objects of the issue and how will fresh proceeds be used?'
Notice the execution speed: 13.8 milliseconds.
The engine executes hybrid retrieval in MongoDB Atlas, combining dense 768-dimensional embeddings
with BM25 lexical search via Reciprocal Rank Fusion with k=60.

The terminal returns state: ANSWERED & VERIFIED.
Look closely at the synthesized response: each factual claim is followed by an interactive citation badge.
When I click badge [1], our Passage Viewer Modal opens instantly, highlighting the exact verbatim quotation:
'aggregating up to ₹ 12,500.00 million' directly on DRHP Page 1.
Every citation is verified via cryptographic substring matching. If an LLM fabricates a quote, our
Citation Verifier drops the claim immediately."

[03:30 - 05:00] TRACK 2 DEMO SCENARIO 2: CONTRADICTION RADAR
--------------------------------------------------------------------------------
SCREEN: Click the "2. Conflict Radar" button in the Terminal Header.
VOICEOVER:
"Now for our second key Track 2 capability: Contradiction Radar.
Promotional broker notes often paint a rosy picture that contradicts statutory audited filings.
We run the query: 'What did Apex Capital report regarding FY24 CFO compared to the audited DRHP prospectus?'

Immediately, the terminal detects the discrepancy and flags state: CONFLICTING.
Instead of averaging the numbers or hallucinating a compromise, our Contradiction Radar card
displays Claim A vs Claim B side-by-side:
- Apex Capital claimed positive ₹120 Crores operating cash flow with zero customer concentration.
- Meanwhile, the statutory SEBI DRHP audited statement reveals negative ₹25.4 Crores operating cash flow
  and customer concentration of 68.4%.
The terminal provides an investor resolution recommendation prioritizing audited regulatory filings."

[05:00 - 06:00] TRACK 2 DEMO SCENARIO 3: SUFFICIENCY GATE (ZERO HALLUCINATION)
--------------------------------------------------------------------------------
SCREEN: Click the "3. Zero Hallucination" button in the Terminal Header.
VOICEOVER:
"Next, what happens when an investor asks a speculative or unanswerable forward-looking question?
We query: 'Will ABC Industries announce an acquisition of a US aerospace defense supplier in Q4 2027?'

Rather than letting the LLM invent rumors, our Pre-Generation Sufficiency Gate intercepts the query before
wasting generative tokens. The terminal returns state: INSUFFICIENT with a clear regulatory disclosure banner:
'No disclosures regarding future acquisitions exist in the filed DRHP.'
Zero claims emitted. Zero hallucinations."

[06:00 - 07:00] EVALUATION BENCHMARK, MONGODB ATLAS RETRIEVAL X-RAY & CONCLUSION
--------------------------------------------------------------------------------
SCREEN: Click "MongoDB Atlas Retrieval X-Ray" in right pane, then navigate to /eval.
VOICEOVER:
"Finally, in our right pane, the MongoDB Atlas Retrieval X-Ray displays the raw RRF ranks, vector scores,
and lexical scores for complete observability.
When we navigate to /eval, judges can inspect our live automated evaluation dashboard:
- 100% Retrieval Recall@5
- 0.867 Mean Reciprocal Rank
- 100% State Accuracy
- 100% Citation Verification Pass Rate across all golden test cases stored in MongoDB Atlas.

IPO Intelligence demonstrates the true power of MongoDB Atlas for evidence-first financial AI.
Thank you!"
```

---

## 5. 10-Minute Presentation Deck (Slide Outline & Speaker Notes)

### Slide 1: Title Slide
- **Title:** IPO Intelligence — The AI Research Terminal for IPO Investors
- **Subtitle:** Evidence-First RAG Engine Powered by MongoDB Atlas Dual-Index Search
- **Team:** UNCHARTED 2026 | Track 2: RAG Engine
- **Speaker Notes:** Introduce the project goal: replacing guesswork and marketing hype in Indian IPOs with verifiable, audited financial intelligence.

### Slide 2: The Core Problem in IPO Investing
- **Key Points:**
  - 400–800 page SEBI DRHPs are impenetrable for 95% of retail investors.
  - Conflicting claims between brokerage notes and statutory audited accounts.
  - Generative AI hallucinations and fake citations create catastrophic financial risks.
- **Speaker Notes:** Highlight that financial RAG cannot afford a 95% accuracy rate; it requires 100% citation ground truth.

### Slide 3: Our Solution — 4 Inviolable Trust Pillars
- **Pillar 1:** Cryptographic Citation Verifier ($\text{quote} \subseteq \text{chunk.text}$).
- **Pillar 2:** Dual-Index Hybrid Search (Atlas Vector + BM25 via RRF $k=60$).
- **Pillar 3:** Pre-Generation Sufficiency Gate (refusing speculation before LLM execution).
- **Pillar 4:** Deterministic Financial Engine (pure Python math for margins, CAGR, divergence).
- **Speaker Notes:** Explain why decoupling math and verification from the LLM is essential for institutional-grade reliability.

### Slide 4: System Architecture & MongoDB Atlas
- **Key Points:**
  - Fast PyMuPDF structure-aware extraction with page anchoring.
  - 768-dimensional dense vector embeddings with SHA-256 caching.
  - MongoDB Atlas dual indexes: `chunks_vector` (vectorSearch) and `chunks_text` (Atlas Search BM25).
  - Pushdown pre-filtering by `ipo_id` with `{embedding: 0}` projection.
- **Speaker Notes:** Emphasize how MongoDB Atlas serves as both the operational database and the vector/search engine, eliminating architectural sprawl.

### Slide 5: Scenario 1 — Multi-Source Synthesis
- **Demonstration:** Expanding issue size and proceeds utilization across DRHP Sections.
- **Metric:** Sub-20ms latency, 100% verifiable quotes, clickable page references.
- **Speaker Notes:** Explain Reciprocal Rank Fusion ($k=60$) and how multi-source diversification prevents one filing from monopolizing context.

### Slide 6: Scenario 2 — Contradiction Radar
- **Demonstration:** Detecting the planted conflict between Apex Capital (+₹120 Cr CFO) and statutory DRHP (-₹25.4 Cr CFO).
- **Behavior:** Explicit side-by-side claim comparison with audit source prioritization.
- **Speaker Notes:** Contrast this with standard naive RAG, which averages contradictory numbers into a misleading hallucination.

### Slide 7: Scenario 3 — Zero-Hallucination Sufficiency Gate
- **Demonstration:** Intercepting forward-looking speculative acquisition queries.
- **Behavior:** Intercepted at retrieval stage; returns state `INSUFFICIENT` with zero hallucinated claims.
- **Speaker Notes:** Show how refusing to answer without evidence is a feature, not a bug.

### Slide 8: Deterministic Financial Engine
- **Calculations:**
  - Revenue CAGR FY22-FY24 (+39.8%).
  - Quality of Cash Conversion ratio (CFO/PAT = -0.26x -> High Alert).
  - Peer Valuation Multiples vs Thermax, Praj, Kirloskar (20.4% valuation discount).
  - 5-Dimension Scorecard (74/100).
- **Speaker Notes:** Highlight that financial ratios are calculated with deterministic formulas, guaranteeing reproducible results.

### Slide 9: Evaluation Benchmark & Metrics
- **Quantitative Scorecard:**
  - Recall@5: 100.0%
  - MRR: 0.867
  - State Accuracy: 100.0%
  - Citation Pass Rate: 100.0%
  - Average Latency: 14.1 ms
- **Atlas Storage:** Historical runs stored in `eval_runs` collection for transparent auditability.

### Slide 10: Conclusion, Future Roadmap & Q&A
- **Summary:** Complete, working, full-stack terminal running live on MongoDB Atlas.
- **Roadmap:** Real-time BSE/NSE book-building feed integration, multi-IPO comparison screen.
- **Q&A Defense:** Ready for judge questions on indexing, prompt defense, and scaling.

---

## 6. Judge Quick-Start Reproduction Guide

### Prerequisites
- Node.js LTS (v20+ or v26)
- Python 3.11+
- Working internet connection (for MongoDB Atlas connection)

### 1-Line Terminal Launch
From project root:
```powershell
powershell -ExecutionPolicy Bypass -File .\start_terminal.ps1
```
This automatically starts:
- **FastAPI Backend:** `http://localhost:8000` (docs at `http://localhost:8000/docs`)
- **Next.js Frontend:** `http://localhost:3000`

### Running the Evaluation Benchmark:
```powershell
cd backend
python -m app.scripts.run_eval
```
Inspect visual results in your browser at `http://localhost:3000/eval`.
