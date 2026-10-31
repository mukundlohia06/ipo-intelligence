from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class SourceOrigin(BaseModel):
    kind: str = "seed" # seed | upload | url
    filename: Optional[str] = None
    url: Optional[str] = None

class SectionHeader(BaseModel):
    id: str
    title: str
    page_number: int
    char_start: int
    char_end: int

class SourceModel(BaseModel):
    id: str = Field(alias="_id")
    ipo_id: str
    title: str
    doc_type: str = "drhp" # drhp | rhp | financials | report | news
    origin: SourceOrigin = Field(default_factory=SourceOrigin)
    content_hash: str # sha256 for idempotent ingest
    total_pages: int = 1
    chunks_count: int = 0
    sections: List[SectionHeader] = Field(default_factory=list)
    status: str = "queued" # queued | parsing | chunked | embedding | searchable | failed
    error: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
