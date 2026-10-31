from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class IssueDetails(BaseModel):
    price_band_low: float = 450.0
    price_band_high: float = 475.0
    price_band_str: str = "₹450 - ₹475"
    issue_size_cr: float = 1250.0
    fresh_issue_cr: float = 800.0
    ofs_cr: float = 450.0
    lot_size: int = 31
    open_date: Optional[str] = "2026-11-04"
    close_date: Optional[str] = "2026-11-06"
    listing_date: Optional[str] = "2026-11-11"

class ScoreBreakdown(BaseModel):
    overall: int = Field(default=74, ge=0, le=100)
    recommendation: str = "APPLY" # APPLY | MAYBE | AVOID
    recommendation_horizon: str = "Long-Term" # Long-Term | Listing Gains | Capital Protection
    fundamentals: int = Field(default=24, ge=0, le=30)
    valuation: int = Field(default=14, ge=0, le=20)
    risks: int = Field(default=18, ge=0, le=25)
    sentiment: int = Field(default=11, ge=0, le=15)
    listing_potential: int = Field(default=7, ge=0, le=10)
    key_drivers: List[str] = Field(default_factory=list)

class IpoModel(BaseModel):
    id: str = Field(alias="_id")
    company_name: str
    symbol: Optional[str] = None
    sector: str
    summary: str
    issue_details: IssueDetails = Field(default_factory=IssueDetails)
    score_breakdown: ScoreBreakdown = Field(default_factory=ScoreBreakdown)
    documents_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
