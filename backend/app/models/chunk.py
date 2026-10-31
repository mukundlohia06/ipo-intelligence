from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class ChunkMetadata(BaseModel):
    doc_type: str = "drhp" # drhp | financials | report
    financial_year: Optional[str] = None # e.g. FY24
    category: Optional[str] = None # risk | litigation | valuation | operations
    tags: List[str] = Field(default_factory=list)

class ChunkModel(BaseModel):
    id: str = Field(alias="_id")
    ipo_id: str
    source_id: str
    ordinal: int
    page_number: int
    section_title: str
    text: str
    text_for_embedding: Optional[str] = None
    char_start: int = 0
    char_end: int = 0
    token_count: int = 0
    embedding: Optional[List[float]] = None # Omitted in standard projections
    embedding_model: str = "text-embedding-004"
    metadata: ChunkMetadata = Field(default_factory=ChunkMetadata)
    flags: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
