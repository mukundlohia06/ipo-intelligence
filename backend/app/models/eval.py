from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class EvalCaseModel(BaseModel):
    id: str = Field(alias="_id")
    ipo_id: str
    question: str
    category: str # single-source | multi-source | conflict | unanswerable | exact-token
    expected_source_ids: List[str]
    expected_state: str = "ANSWERED" # ANSWERED | CONFLICTING | INSUFFICIENT
    must_contain: List[str] = Field(default_factory=list)
    notes: Optional[str] = None

    class Config:
        populate_by_name = True

class EvalCaseResult(BaseModel):
    case_id: str
    question: str
    category: str
    expected_source_ids: List[str]
    retrieved_source_ids: List[str]
    source_hit: bool
    expected_state: str
    actual_state: str
    state_match: bool
    citation_verified: bool
    latency_ms: float

class EvalRunModel(BaseModel):
    id: str = Field(alias="_id")
    config_name: str = "hybrid_rrf_k60"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    recall_at_5: float
    mrr: float
    citation_verification_rate: float
    state_accuracy: float
    avg_latency_ms: float
    total_cases: int
    passed_cases: int
    case_results: List[EvalCaseResult] = Field(default_factory=list)

    class Config:
        populate_by_name = True
