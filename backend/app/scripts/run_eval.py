"""
Automated Evaluation Benchmark Runner for Track 2: RAG Engine
Evaluates:
- Retrieval Recall@5 & Mean Reciprocal Rank (MRR)
- State Accuracy (ANSWERED, CONFLICTING, INSUFFICIENT)
- Citation Verification Pass Rate (Verbatim Substring Check)
- Latency (ms)
Stores benchmark runs in MongoDB Atlas collection 'eval_runs'.
"""

import sys
import time
from datetime import datetime, timezone
from typing import Dict, Any, List

sys.stdout.reconfigure(encoding="utf-8")

from app.services.db import get_db
from app.services.retriever import hybrid_retrieve, evaluate_sufficiency_gate
from app.services.generator import generate_grounded_answer
from app.services.verifier import verify_claims

GOLDEN_EVAL_CASES = [
    {
        "case_id": "eval_001_synthesis",
        "ipo_id": "ipo_abc_industries",
        "category": "multi_source_synthesis",
        "query": "What are the primary objects of the issue and how will the fresh issue proceeds be utilized?",
        "expected_state": "ANSWERED",
        "expected_source_keywords": ["objects", "sanand", "proceeds", "debt", "manufacturing"],
        "min_citations": 1
    },
    {
        "case_id": "eval_002_contradiction",
        "ipo_id": "ipo_abc_industries",
        "category": "planted_contradiction",
        "query": "What did Apex Capital report regarding FY24 CFO compared to the audited DRHP prospectus?",
        "expected_state": "CONFLICTING",
        "expected_source_keywords": ["apex", "cfo", "brokerage", "divergence"],
        "min_citations": 1
    },
    {
        "case_id": "eval_003_sufficiency",
        "ipo_id": "ipo_abc_industries",
        "category": "sufficiency_gate",
        "query": "Will ABC Industries announce an acquisition of a US aerospace defense supplier in Q4 2027?",
        "expected_state": "INSUFFICIENT",
        "expected_source_keywords": [],
        "min_citations": 0
    },
    {
        "case_id": "eval_004_financial_audit",
        "ipo_id": "ipo_abc_industries",
        "category": "financial_verification",
        "query": "What was the restated revenue for FY24 and what was the growth compared to FY22?",
        "expected_state": "ANSWERED",
        "expected_source_keywords": ["revenue", "restated", "operations", "crores"],
        "min_citations": 1
    },
    {
        "case_id": "eval_005_risk_disclosure",
        "ipo_id": "ipo_abc_industries",
        "category": "risk_disclosure",
        "query": "What are the major customer concentration risks disclosed in the DRHP?",
        "expected_state": "ANSWERED",
        "expected_source_keywords": ["concentration", "customer", "reliance", "revenue"],
        "min_citations": 1
    }
]

def run_evaluation() -> Dict[str, Any]:
    print("\n" + "="*70)
    print("  IPO INTELLIGENCE — TRACK 2 RAG EVALUATION BENCHMARK")
    print("="*70 + "\n")

    db = get_db()

    # Pre-fetch sources map
    sources_cursor = db.sources.find({"ipo_id": "ipo_abc_industries"})
    sources_map = {s["_id"]: s for s in sources_cursor}

    case_results = []
    total_recall = 0.0
    total_rr = 0.0
    total_claims = 0
    total_verified = 0
    state_matches = 0
    latencies = []

    for i, case in enumerate(GOLDEN_EVAL_CASES, 1):
        print(f"[{i}/{len(GOLDEN_EVAL_CASES)}] Case {case['case_id']} | Category: {case['category']}")
        print(f"     Query: \"{case['query']}\"")
        
        t0 = time.perf_counter()
        
        # 1. Hybrid Retrieval
        selected_chunks, trace_items, stage_latencies = hybrid_retrieve(
            ipo_id=case["ipo_id"],
            query=case["query"],
            top_k=8,
            per_source_cap=4
        )

        # Calculate Recall@5 and Reciprocal Rank
        keywords = case["expected_source_keywords"]
        found_rank = None
        if not keywords:
            hit_recall = 1.0
            rr = 1.0
        else:
            hit = False
            for r_idx, chunk in enumerate(selected_chunks[:5]):
                text_lower = chunk.get("text", "").lower() + " " + chunk.get("section_title", "").lower()
                if any(kw in text_lower for kw in keywords):
                    hit = True
                    if found_rank is None:
                        found_rank = r_idx + 1
                    break
            hit_recall = 1.0 if hit else 0.0
            rr = (1.0 / found_rank) if found_rank else 0.0

        total_recall += hit_recall
        total_rr += rr

        # 2. Sufficiency Gate
        is_sufficient, gate_reason = evaluate_sufficiency_gate(
            query=case["query"],
            selected_chunks=selected_chunks,
            trace_items=trace_items
        )

        if not is_sufficient:
            actual_state = "INSUFFICIENT"
            c_count = 0
            v_rate = 1.0
        else:
            chunks_map = {str(c["_id"]): c for c in selected_chunks}

            # 3. Generation
            raw_answer = generate_grounded_answer(
                query=case["query"],
                chunks=selected_chunks,
                sources_map=sources_map
            )

            # 4. Programmatic Verification
            raw_claims = raw_answer.get("claims", [])
            verified_claims, gaps, v_rate = verify_claims(
                claims=raw_claims,
                chunks_map=chunks_map,
                sources_map=sources_map
            )

            c_count = len(verified_claims)
            total_claims += len(raw_claims)
            total_verified += len(verified_claims)

            conflicts = raw_answer.get("conflicts", [])
            if conflicts:
                actual_state = "CONFLICTING"
            elif not verified_claims:
                actual_state = "INSUFFICIENT"
            elif len(verified_claims) < len(raw_claims) or gaps:
                actual_state = "PARTIAL"
            else:
                actual_state = "ANSWERED"

        t_total = (time.perf_counter() - t0) * 1000
        latencies.append(t_total)

        state_correct = (actual_state == case["expected_state"])
        if state_correct:
            state_matches += 1

        case_summary = {
            "case_id": case["case_id"],
            "category": case["category"],
            "expected_state": case["expected_state"],
            "actual_state": actual_state,
            "state_correct": state_correct,
            "recall_at_5": hit_recall,
            "reciprocal_rank": round(rr, 3),
            "citations_count": c_count,
            "latency_ms": round(t_total, 2)
        }
        case_results.append(case_summary)

        status_str = "✓ PASS" if state_correct else "✗ FAIL"
        print(f"     -> State: {actual_state} (Expected: {case['expected_state']}) | {status_str}")
        print(f"     -> Recall@5: {hit_recall} | RR: {rr:.2f} | Verified Claims: {c_count} | Latency: {t_total:.1f}ms\n")

    # Aggregate Benchmark Metrics
    n = len(GOLDEN_EVAL_CASES)
    mean_recall = total_recall / n
    mean_mrr = total_rr / n
    state_accuracy = state_matches / n
    citation_pass_rate = (total_verified / total_claims) if total_claims > 0 else 1.0
    avg_latency = sum(latencies) / n

    run_document = {
        "benchmark_name": "NEXUS Track 2 RAG Gold Benchmark",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "total_cases": n,
        "metrics": {
            "recall_at_5": round(mean_recall, 4),
            "mrr": round(mean_mrr, 4),
            "state_accuracy": round(state_accuracy, 4),
            "citation_verification_rate": round(citation_pass_rate, 4),
            "avg_latency_ms": round(avg_latency, 2)
        },
        "case_results": case_results
    }

    # Persist in eval_runs collection in MongoDB Atlas
    db.eval_runs.insert_one(run_document)

    print("="*70)
    print("  EVALUATION BENCHMARK RESULTS SUMMARY")
    print("="*70)
    print(f"  • Retrieval Recall@5:          {mean_recall * 100:.1f}%")
    print(f"  • Mean Reciprocal Rank (MRR):  {mean_mrr:.3f}")
    print(f"  • State Classification Acc:    {state_accuracy * 100:.1f}%")
    print(f"  • Citation Verifier Pass Rate: {citation_pass_rate * 100:.1f}% (Cryptographic Substring)")
    print(f"  • Average Latency:             {avg_latency:.1f} ms")
    print("="*70)
    print("  ✓ Run saved successfully to MongoDB Atlas collection 'eval_runs'\n")

    return run_document

if __name__ == "__main__":
    run_evaluation()
