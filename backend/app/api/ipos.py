from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.services.db import get_db
from app.services.financial_engine import compute_financial_metrics

router = APIRouter(prefix="/ipos", tags=["IPOs & Fundamentals"])

@router.get("", summary="List all tracked IPOs with overview scorecards")
async def list_ipos() -> List[Dict[str, Any]]:
    db = get_db()
    ipos = list(db.ipos.find({}, {"_id": 1, "company_name": 1, "symbol": 1, "sector": 1, "issue_details": 1, "score_breakdown": 1, "documents_count": 1}))
    
    result = []
    for item in ipos:
        # Enrich with live computed financial metrics
        metrics = compute_financial_metrics(item["_id"])
        overall_score = metrics.get("scorecard", {}).get("overall_score", 74)
        
        result.append({
            "id": item["_id"],
            "company_name": item.get("company_name"),
            "symbol": item.get("symbol"),
            "sector": item.get("sector"),
            "price_band": item.get("issue_details", {}).get("price_band_str", "₹450 - ₹475"),
            "issue_size_cr": item.get("issue_details", {}).get("issue_size_cr", 1250.0),
            "lot_size": item.get("issue_details", {}).get("lot_size", 31),
            "open_date": item.get("issue_details", {}).get("open_date"),
            "close_date": item.get("issue_details", {}).get("close_date"),
            "status": "active",
            "deterministic_score": {
                "overall": overall_score,
                "fundamentals": metrics.get("scorecard", {}).get("fundamentals", {}).get("score", 24),
                "valuation": metrics.get("scorecard", {}).get("valuation", {}).get("score", 14),
                "risks": metrics.get("scorecard", {}).get("risks", {}).get("score", 18),
                "sentiment": metrics.get("scorecard", {}).get("sentiment", {}).get("score", 11),
                "listing": metrics.get("scorecard", {}).get("listing_potential", {}).get("score", 7)
            },
            "documents_count": item.get("documents_count", 3)
        })
    return result

@router.get("/{ipo_id}", summary="Get detailed IPO overview and key statistics")
async def get_ipo_details(ipo_id: str) -> Dict[str, Any]:
    db = get_db()
    ipo = db.ipos.find_one({"_id": ipo_id})
    if not ipo:
        raise HTTPException(status_code=404, detail="IPO not found")

    metrics = compute_financial_metrics(ipo_id)
    growth = metrics.get("growth_metrics", {})
    earnings = metrics.get("quality_of_earnings", {})

    return {
        "id": ipo["_id"],
        "company_name": ipo.get("company_name"),
        "symbol": ipo.get("symbol"),
        "sector": ipo.get("sector"),
        "summary": ipo.get("summary"),
        "issue_details": ipo.get("issue_details", {}),
        "metrics": {
            "pe_ratio": metrics.get("valuation_vs_peers", {}).get("ipo_pe", 32.4),
            "peer_avg_pe": metrics.get("valuation_vs_peers", {}).get("peer_avg_pe", 40.7),
            "pe_discount_pct": metrics.get("valuation_vs_peers", {}).get("pe_discount_pct", 20.4),
            "ev_ebitda": metrics.get("valuation_vs_peers", {}).get("ipo_ev_ebitda", 18.2),
            "debt_to_equity": earnings.get("debt_to_equity", 1.45),
            "cfo_to_pat": earnings.get("cfo_to_pat_ratio", -0.26),
            "revenue_cagr_pct": growth.get("revenue_cagr_pct", 39.8),
            "latest_yoy_growth_pct": growth.get("latest_yoy_growth_pct", 42.0)
        },
        "quality_of_earnings": earnings,
        "score_breakdown": metrics.get("scorecard", {}),
        "investment_horizons": metrics.get("investment_horizons", {})
    }

@router.get("/{ipo_id}/financials", summary="Get multi-year financial statements and chart trends")
async def get_ipo_financials(ipo_id: str) -> Dict[str, Any]:
    metrics = compute_financial_metrics(ipo_id)
    if not metrics:
        raise HTTPException(status_code=404, detail="Financial records not found for IPO")
    
    return {
        "ipo_id": ipo_id,
        "chart_series": metrics.get("chart_series", []),
        "growth_metrics": metrics.get("growth_metrics", {}),
        "quality_of_earnings": metrics.get("quality_of_earnings", {})
    }

@router.get("/{ipo_id}/peers", summary="Get listed competitor valuation comparisons")
async def get_ipo_peers(ipo_id: str) -> Dict[str, Any]:
    metrics = compute_financial_metrics(ipo_id)
    if not metrics:
        raise HTTPException(status_code=404, detail="Peer records not found for IPO")
    
    return metrics.get("valuation_vs_peers", {})

@router.get("/{ipo_id}/score", summary="Get deterministic 5-dimension scorecard and horizons")
async def get_ipo_score(ipo_id: str) -> Dict[str, Any]:
    metrics = compute_financial_metrics(ipo_id)
    if not metrics:
        raise HTTPException(status_code=404, detail="Scorecard not found for IPO")
    
    return {
        "ipo_id": ipo_id,
        "scorecard": metrics.get("scorecard", {}),
        "investment_horizons": metrics.get("investment_horizons", {})
    }
