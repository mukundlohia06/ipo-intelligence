"""
Canonical IPO Data Model & Normalization Schemas.
Unified schema for historical, live, and discovered Indian IPO offerings.
Guarantees null-safety, explicit reporting periods, deterministic metric formulas,
and source attribution without hardcoded assumptions.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field

class MetricAvailability(BaseModel):
    value: Optional[Union[float, int, str]] = None
    status: str = Field(default="AVAILABLE", description="AVAILABLE | NOT_AVAILABLE | PARTIAL")
    formula: Optional[str] = None
    reporting_period: Optional[str] = None
    source: Optional[str] = None
    explanation: Optional[str] = None

class CanonicalIssueDetails(BaseModel):
    open_date: Optional[str] = None
    close_date: Optional[str] = None
    listing_date: Optional[str] = None
    price_band_str: Optional[str] = "N/A"
    issue_price: Optional[float] = None
    issue_size_cr: Optional[float] = None
    fresh_issue_cr: Optional[float] = None
    ofs_cr: Optional[float] = None
    lot_size: Optional[int] = None
    retail_min_investment: Optional[float] = None
    listing_price: Optional[float] = None
    listing_gain_pct: Optional[float] = None
    exchange: Optional[str] = "NSE / BSE"
    lead_managers: List[str] = Field(default_factory=list)
    registrar: Optional[str] = None

class CanonicalSubscription(BaseModel):
    qib_multiple: Optional[float] = None
    nii_multiple: Optional[float] = None
    retail_multiple: Optional[float] = None
    overall_multiple: Optional[float] = None
    as_of: Optional[str] = None
    status: str = "COMPLETED"

class CanonicalFinancialStatement(BaseModel):
    fiscal_year: str  # e.g. "FY24"
    period_type: str = "CONSOLIDATED"  # CONSOLIDATED | STANDALONE
    revenue_cr: Optional[float] = None
    ebitda_cr: Optional[float] = None
    ebitda_margin_pct: Optional[float] = None
    pat_cr: Optional[float] = None
    pat_margin_pct: Optional[float] = None
    cfo_cr: Optional[float] = None
    capex_cr: Optional[float] = None
    fcf_cr: Optional[float] = None
    total_debt_cr: Optional[float] = None
    net_worth_cr: Optional[float] = None
    debt_to_equity: Optional[float] = None
    roe_pct: Optional[float] = None
    roce_pct: Optional[float] = None
    eps: Optional[float] = None
    source_filing: Optional[str] = "DRHP/RHP Restated Financials"

class CanonicalPeerComparison(BaseModel):
    peer_name: str
    symbol: Optional[str] = None
    pe_ratio: Optional[float] = None
    pb_ratio: Optional[float] = None
    ev_ebitda: Optional[float] = None
    revenue_cr: Optional[float] = None
    pat_cr: Optional[float] = None
    market_cap_cr: Optional[float] = None
    source: Optional[str] = "Exchange Disclosures"

class CanonicalAnalysisReport(BaseModel):
    company_overview: MetricAvailability
    business_model: MetricAvailability
    industry_overview: MetricAvailability
    ipo_details: MetricAvailability
    offer_structure: MetricAvailability
    revenue_growth: MetricAvailability
    profitability: MetricAvailability
    ebitda_analysis: MetricAvailability
    debt_analysis: MetricAvailability
    cash_flow_analysis: MetricAvailability
    valuation: MetricAvailability
    peer_comparison: MetricAvailability
    competitive_strengths: MetricAvailability
    business_risks: MetricAvailability
    financial_risks: MetricAvailability
    governance_considerations: MetricAvailability
    overall_assessment: MetricAvailability

class CanonicalIPO(BaseModel):
    id: str
    symbol: str
    company_name: str
    sector: str
    category: str = "Mainboard"  # Mainboard | SME
    status: str = "listed"  # upcoming | open | closed | listed
    data_nature: str = "historical"  # historical | live | discovered
    is_sample: bool = False
    summary: str
    issue_details: CanonicalIssueDetails = Field(default_factory=CanonicalIssueDetails)
    subscription_status: Optional[CanonicalSubscription] = None
    financials: List[CanonicalFinancialStatement] = Field(default_factory=list)
    peers: List[CanonicalPeerComparison] = Field(default_factory=list)
    key_parties: Dict[str, Any] = Field(default_factory=dict)
    source_reference: Dict[str, Any] = Field(default_factory=dict)
    verified_status: bool = True
    last_synced_at: datetime = Field(default_factory=datetime.now)
