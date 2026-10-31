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
from app.services.discovery_service import get_or_discover_ipo

router = APIRouter(prefix="/research", tags=["RAG Research Terminal"])

class MessageHistoryItem(BaseModel):
    role: str  # user | assistant
    content: str

class QueryRequest(BaseModel):
    conversation_id: Optional[str] = None
    ipo_id: Optional[str] = "ipo_hyundai_motor_india"
    doc_id: Optional[str] = None  # Strict document-scoped query filter
    question: str
    mode: str = "qa"  # qa | compare | brief
    filters: Dict[str, Any] = Field(default_factory=dict)
    conversation_history: List[MessageHistoryItem] = Field(default_factory=list)

@router.post("/query", summary="Execute grounded hybrid RAG research query")
async def execute_research_query(req: QueryRequest) -> Dict[str, Any]:
    start_total = time.time()
    db = get_db()
    
    question = req.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Research question cannot be empty.")

    # 1. Hybrid Retrieval (Vector + Lexical with RRF & Document Isolation)
    selected_chunks, trace_items, stage_latencies = hybrid_retrieve(
        ipo_id=req.ipo_id,
        doc_id=req.doc_id,
        query=question,
        top_k=8,
        per_source_cap=4
    )

    # 2. Sufficiency Gate:
    # If the user specifically scoped the query to a document (doc_id is set),
    # enforce strict evidence gate to prevent hallucinations outside that document.
    if req.doc_id:
        is_sufficient, gate_reason = evaluate_sufficiency_gate(
            query=question,
            selected_chunks=selected_chunks,
            trace_items=trace_items
        )

        if not is_sufficient:
            total_ms = round((time.time() - start_total) * 1000, 2)
            stage_latencies["total_ms"] = total_ms

            response_payload = {
                "id": f"q_{hashlib.md5(f'{req.ipo_id}_{req.doc_id}_{question}_{time.time()}'.encode()).hexdigest()[:10]}",
                "conversation_id": req.conversation_id,
                "ipo_id": req.ipo_id,
                "doc_id": req.doc_id,
                "question": question,
                "mode": req.mode,
                "state": "INSUFFICIENT",
                "summary": gate_reason,
                "direct_answer": gate_reason,
                "key_findings": ["The selected document does not contain verifiable disclosures regarding this query."],
                "financial_implications": "Cannot draw financial conclusions without primary documentation.",
                "risks": ["Information unavailable in selected document."],
                "claims": [],
                "conflicts": [],
                "gaps": [gate_reason],
                "follow_up_questions": [
                    "What are the verified objects of the IPO in this document?",
                    "What are the major risk factors disclosed in this document?",
                    "What are the restated revenue and borrowing figures in the RHP?"
                ],
                "llm_provider": "sufficiency_gate",
                "llm_configured": False,
                "trace": trace_items,
                "latency_ms": stage_latencies,
                "verification_rate": 1.0,
                "created_at": datetime.now().isoformat()
            }
            db.queries.insert_one({**response_payload, "_id": response_payload["id"]})
            return response_payload

    # Fetch sources map for title resolution
    query_src = {}
    if req.ipo_id and req.ipo_id != "all":
        query_src["ipo_id"] = req.ipo_id
    if req.doc_id:
        query_src["_id"] = req.doc_id
    sources_cursor = db.sources.find(query_src)
    sources_map = {s["_id"]: s for s in sources_cursor}
    chunks_map = {str(c["_id"]): c for c in selected_chunks}

    # Fetch structured IPO context if query references an IPO
    ipo_context = None
    if req.ipo_id and req.ipo_id != "all":
        ipo_context = get_or_discover_ipo(req.ipo_id)

    # 3. Structured Generation (Gemini LLM or Extractive Evidence Engine)
    t_gen_start = time.time()
    raw_answer = generate_grounded_answer(
        query=question,
        chunks=selected_chunks,
        sources_map=sources_map,
        conversation_history=[h.dict() for h in req.conversation_history],
        ipo_context=ipo_context,
        is_doc_scoped=bool(req.doc_id)
    )
    stage_latencies["llm_ms"] = round((time.time() - t_gen_start) * 1000, 2)

    # 4. Programmatic Citation Verifier (Trust Anchor for claims referencing chunks)
    raw_claims = raw_answer.get("claims", [])
    if selected_chunks and raw_claims:
        verified_claims, gaps, v_rate = verify_claims(
            claims=raw_claims,
            chunks_map=chunks_map,
            sources_map=sources_map
        )
    else:
        verified_claims = raw_claims
        gaps = []
        v_rate = 1.0

    # Reconcile gaps & conflicts
    all_gaps = list(set(raw_answer.get("gaps", []) + gaps))
    conflicts = raw_answer.get("conflicts", [])

    # 5. State Machine Resolution
    if raw_answer.get("state") == "UNCONFIGURED":
        final_state = "UNCONFIGURED"
    elif conflicts:
        final_state = "CONFLICTING"
    elif req.doc_id and not verified_claims:
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
        "conversation_id": req.conversation_id,
        "ipo_id": req.ipo_id,
        "doc_id": req.doc_id,
        "question": question,
        "mode": req.mode,
        "state": final_state,
        "summary": raw_answer.get("summary", ""),
        "direct_answer": raw_answer.get("direct_answer", raw_answer.get("summary", "")),
        "key_findings": raw_answer.get("key_findings", []),
        "financial_implications": raw_answer.get("financial_implications", ""),
        "risks": raw_answer.get("risks", []),
        "claims": verified_claims,
        "conflicts": conflicts,
        "gaps": all_gaps,
        "follow_up_questions": raw_answer.get("follow_up_questions", []),
        "llm_provider": raw_answer.get("llm_provider", "gemini"),
        "llm_configured": raw_answer.get("llm_configured", False),
        "trace": trace_items,
        "latency_ms": stage_latencies,
        "verification_rate": v_rate,
        "created_at": datetime.now().isoformat()
    }

    # Asynchronously log query execution to MongoDB
    db.queries.insert_one({**response_payload, "_id": query_id})

    # Save to conversation thread if conversation_id is provided
    if req.conversation_id:
        db.conversations.update_one(
            {"_id": req.conversation_id},
            {
                "$push": {
                    "messages": {
                        "$each": [
                            {"role": "user", "content": question, "timestamp": datetime.now()},
                            {"role": "assistant", "content": response_payload["direct_answer"], "payload": response_payload, "timestamp": datetime.now()}
                        ]
                    }
                },
                "$setOnInsert": {
                    "created_at": datetime.now(),
                    "ipo_id": req.ipo_id
                }
            },
            upsert=True
        )

    return response_payload

@router.get("/conversations/{conversation_id}", summary="Get conversation thread history")
async def get_conversation_thread(conversation_id: str) -> Dict[str, Any]:
    db = get_db()
    conv = db.conversations.find_one({"_id": conversation_id})
    if not conv:
        return {"conversation_id": conversation_id, "messages": []}
    return {
        "conversation_id": conversation_id,
        "ipo_id": conv.get("ipo_id"),
        "messages": conv.get("messages", [])
    }

@router.delete("/conversations/{conversation_id}", summary="Clear conversation thread history")
async def clear_conversation_thread(conversation_id: str) -> Dict[str, Any]:
    db = get_db()
    db.conversations.delete_one({"_id": conversation_id})
    return {"status": "cleared", "conversation_id": conversation_id}
