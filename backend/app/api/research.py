import time
import hashlib
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.db import get_db
from app.services.retriever import hybrid_retrieve, evaluate_sufficiency_gate
from app.services.generator import generate_grounded_answer
from app.services.verifier import verify_claims

router = APIRouter(prefix="/research", tags=["RAG Research Terminal"])

class QueryRequest(BaseModel):
    ipo_id: str = "ipo_abc_industries"
    question: str
    mode: str = "qa" # qa | compare | brief
    filters: Dict[str, Any] = Field(default_factory=dict)

@router.post("/query", summary="Execute grounded hybrid RAG research query")
async def execute_research_query(req: QueryRequest) -> Dict[str, Any]:
    start_total = time.time()
    db = get_db()
    
    question = req.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Research question cannot be empty.")

    # 1. Hybrid Retrieval (Vector + Lexical with RRF & Diversification)
    selected_chunks, trace_items, stage_latencies = hybrid_retrieve(
        ipo_id=req.ipo_id,
        query=question,
        top_k=8,
        per_source_cap=4
    )

    # 2. Sufficiency Gate (Intercepts unanswerable or speculative questions)
    is_sufficient, gate_reason = evaluate_sufficiency_gate(
        query=question,
        selected_chunks=selected_chunks,
        trace_items=trace_items
    )

    if not is_sufficient:
        total_ms = round((time.time() - start_total) * 1000, 2)
        stage_latencies["total_ms"] = total_ms

        response_payload = {
            "id": f"q_{hashlib.md5(f'{req.ipo_id}_{question}_{time.time()}'.encode()).hexdigest()[:10]}",
            "ipo_id": req.ipo_id,
            "question": question,
            "mode": req.mode,
            "state": "INSUFFICIENT",
            "summary": f"Evidence Insufficient: {gate_reason}",
            "claims": [],
            "conflicts": [],
            "gaps": [gate_reason],
            "trace": trace_items,
            "latency_ms": stage_latencies,
            "verification_rate": 1.0,
            "created_at": datetime.now().isoformat()
        }
        
        # Log to queries collection
        db.queries.insert_one({**response_payload, "_id": response_payload["id"]})
        return response_payload

    # Fetch sources map for title resolution
    sources_cursor = db.sources.find({"ipo_id": req.ipo_id})
    sources_map = {s["_id"]: s for s in sources_cursor}
    chunks_map = {str(c["_id"]): c for c in selected_chunks}

    # 3. Structured Generation (Gemini LLM)
    t_gen_start = time.time()
    raw_answer = generate_grounded_answer(
        query=question,
        chunks=selected_chunks,
        sources_map=sources_map
    )
    stage_latencies["llm_ms"] = round((time.time() - t_gen_start) * 1000, 2)

    # 4. Programmatic Citation Verifier (Trust Anchor)
    raw_claims = raw_answer.get("claims", [])
    verified_claims, gaps, v_rate = verify_claims(
        claims=raw_claims,
        chunks_map=chunks_map,
        sources_map=sources_map
    )

    # Reconcile gaps
    all_gaps = list(set(raw_answer.get("gaps", []) + gaps))
    conflicts = raw_answer.get("conflicts", [])

    # 5. State Machine Resolution
    if conflicts:
        final_state = "CONFLICTING"
    elif not verified_claims:
        final_state = "INSUFFICIENT"
    elif len(verified_claims) < len(raw_claims) or all_gaps:
        final_state = "PARTIAL"
    else:
        final_state = raw_answer.get("state", "ANSWERED")

    total_ms = round((time.time() - start_total) * 1000, 2)
    stage_latencies["total_ms"] = total_ms

    query_id = f"q_{hashlib.md5(f'{req.ipo_id}_{question}_{time.time()}'.encode()).hexdigest()[:10]}"
    
    response_payload = {
        "id": query_id,
        "ipo_id": req.ipo_id,
        "question": question,
        "mode": req.mode,
        "state": final_state,
        "summary": raw_answer.get("summary", ""),
        "claims": verified_claims,
        "conflicts": conflicts,
        "gaps": all_gaps,
        "trace": trace_items,
        "latency_ms": stage_latencies,
        "verification_rate": v_rate,
        "created_at": datetime.now().isoformat()
    }

    # Asynchronously log query execution to MongoDB
    db.queries.insert_one({**response_payload, "_id": query_id})

    return response_payload
