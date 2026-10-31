from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any

router = APIRouter(prefix="/ipos", tags=["IPOs & Fundamentals"])

@router.get("", summary="List all tracked IPOs")
async def list_ipos() -> List[Dict[str, Any]]:
    # In Milestone 1 skeleton, returns demo target IPO
    return [
        {
            "id": "ipo_abc_industries",
            "company_name": "ABC Industries Limited",
            "sector": "Industrial Engineering & Clean Tech",
            "price_band": "₹450 - ₹475",
            "issue_size_cr": 1250.0,
            "lot_size": 31,
            "status": "active",
            "deterministic_score": {
                "overall": 74,
                "fundamentals": 24, # out of 30
                "valuation": 14,    # out of 20
                "risks": 18,        # out of 25
                "sentiment": 11,    # out of 15
                "listing": 7        # out of 10
            },
            "documents_count": 3
        }
    ]

@router.get("/{ipo_id}", summary="Get detailed IPO overview and metrics")
async def get_ipo_details(ipo_id: str) -> Dict[str, Any]:
    if ipo_id != "ipo_abc_industries":
        raise HTTPException(status_code=404, detail="IPO not found")
    
    return {
        "id": "ipo_abc_industries",
        "company_name": "ABC Industries Limited",
        "sector": "Industrial Engineering & Clean Tech",
        "price_band": "₹450 - ₹475",
        "issue_size_cr": 1250.0,
        "fresh_issue_cr": 800.0,
        "ofs_cr": 450.0,
        "lot_size": 31,
        "metrics": {
            "pe_ratio": 32.4,
            "sector_pe": 28.1,
            "ev_ebitda": 18.2,
            "debt_to_equity": 1.45,
            "cfo_to_pat": -0.26,
            "pat_margin_pct": 7.6
        },
        "score_breakdown": {
            "overall": 74,
            "recommendation": "APPLY (Long-Term Horizon)",
            "fundamentals": 24,
            "valuation": 14,
            "risks": 18,
            "sentiment": 11,
            "listing": 7
        }
    }
