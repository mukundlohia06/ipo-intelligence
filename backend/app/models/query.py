from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class ClaimItem(BaseModel):
    text: str
    chunk_id: str
    source_title: str
    page_number: int
    quote: str
    quote_start: Optional[int] = None
    quote_end: Optional[int] = None
    verified: bool = False

class ConflictItem(BaseModel):
    topic: str
    source_a_title: str
    source_a_statement: str
    source_b_title: str
    source_b_statement: str
    notes: Optional[str] = None

class TraceItem(BaseModel):
    chunk_id: str
    source_id: str
    page_number: int
    section_title: str
    vector_rank: Optional[int] = None
    vector_score: Optional[float] = None
    lexical_rank: Optional[int] = None
    lexical_score: Optional[float] = None
    rrf_score: float
    diversified: bool = False

class QueryLogModel(BaseModel):
    id: str = Field(alias="_id")
    ipo_id: str
    question: str
    mode: str = "qa" # qa | compare | brief
    filters: Dict[str, Any] = Field(default_factory=dict)
    state: str = "ANSWERED" # ANSWERED | PARTIAL | CONFLICTING | INSUFFICIENT
    summary: str
    claims: List[ClaimItem] = Field(default_factory=list)
    conflicts: List[ConflictItem] = Field(default_factory=list)
    gaps: List[str] = Field(default_factory=list)
    trace: List[TraceItem] = Field(default_factory=list)
    latency_ms: Dict[str, float] = Field(default_factory=dict)
    tokens_in: int = 0
    tokens_out: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
