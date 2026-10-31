from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

router = APIRouter(prefix="/research", tags=["RAG Research Terminal"])

class QueryRequest(BaseModel):
    ipo_id: str = "ipo_abc_industries"
    question: str
    mode: str = "qa" # qa | compare | brief

@router.post("/query", summary="Execute grounded research query")
async def execute_query(req: QueryRequest) -> Dict[str, Any]:
    # Milestone 1 skeleton response
    return {
        "state": "ANSWERED",
        "question": req.question,
        "ipo_id": req.ipo_id,
        "summary": "This is a Milestone 1 skeleton response. Full RAG hybrid retrieval and Gemini LLM reasoning will be active in Milestone 4.",
        "claims": [
            {
                "text": "ABC Industries reported positive revenue growth in FY24 but operating cash flow diverged into negative territory.",
                "chunk_id": "chk_demo_01",
                "source_title": "Draft Red Herring Prospectus (DRHP)",
                "page_number": 184,
                "quote": "cash flow from operating activities was negative ₹ 254.00 million",
                "verified": True
            }
        ],
        "conflicts": [],
        "gaps": []
    }
