from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class FinancialModel(BaseModel):
    id: str = Field(alias="_id")
    ipo_id: str
    fiscal_year: str # e.g. FY24, FY23, FY22
    period_type: str = "Annual" # Annual | Restated | Half-Year
    revenue_cr: float
    ebitda_cr: float
    pat_cr: float
    cfo_cr: float # Cash Flow from Operations (crucial: can be negative!)
    capex_cr: float = 0.0
    borrowings_cr: float = 0.0
    net_worth_cr: float = 0.0
    
    # Deterministic Ratios
    ebitda_margin_pct: float
    pat_margin_pct: float
    debt_to_equity: float
    cfo_to_pat: float
    
    audited: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
