from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class PeerModel(BaseModel):
    id: str = Field(alias="_id")
    ipo_id: str
    peer_name: str
    symbol: Optional[str] = None
    pe_ratio: float
    ev_ebitda: float
    ronw_pct: float
    revenue_cr: float
    market_cap_cr: float
    comparison_notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
