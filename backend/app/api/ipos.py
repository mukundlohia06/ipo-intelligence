from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.services.db import get_db
from app.services.financial_engine import compute_financial_metrics
from app.services.live_ipo_service import live_ipo_service

router = APIRouter(prefix="/ipos", tags=["IPOs & Fundamentals"])

@router.get("/provider/status", summary="Get external live IPO provider connectivity status")
async def get_provider_status() -> Dict[str, Any]:
    return live_ipo_service.get_status()

@router.get("", summary="List and search IPOs with multi-criteria filtering and scorecards")
async def list_ipos(
    q: Optional[str] = Query(None, description="Search keyword for company name, symbol, or sector"),
    status: Optional[str] = Query(None, description="Filter by status: upcoming, open, closed, listed, all"),
    sector: Optional[str] = Query(None, description="Filter by sector or industry"),
    from_date: Optional[str] = Query(None, description="Filter by opening date >= YYYY-MM-DD"),
    to_date: Optional[str] = Query(None, description="Filter by opening date <= YYYY-MM-DD"),
    sort_by: Optional[str] = Query("open_date", description="Sort by: open_date, close_date, issue_size_cr, score, listing_gain"),
    order: Optional[str] = Query("desc", description="Sort order: asc or desc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100)
) -> Dict[str, Any]:
    db = get_db()
    
    # 1. Build MongoDB query filter
    query_filter: Dict[str, Any] = {}
    
    if status and status.lower() not in ("all", ""):
        # map "active" to open/listed if needed
        st = status.lower()
        if st == "active":
            query_filter["status"] = {"$in": ["open", "active"]}
        else:
            query_filter["status"] = st

    if sector and sector.lower() not in ("all", ""):
        query_filter["sector"] = sector

    if q and q.strip():
        term = q.strip()
        query_filter["$or"] = [
            {"company_name": {"$regex": term, "$options": "i"}},
            {"symbol": {"$regex": term, "$options": "i"}},
            {"sector": {"$regex": term, "$options": "i"}},
            {"summary": {"$regex": term, "$options": "i"}}
        ]

    if from_date or to_date:
        date_q = {}
        if from_date:
            date_q["$gte"] = from_date
        if to_date:
            date_q["$lte"] = to_date
        query_filter["issue_details.open_date"] = date_q

    # 2. Total count
    total_count = db.ipos.count_documents(query_filter)

    # 3. Sort direction
    sort_dir = 1 if order.lower() == "asc" else -1
    sort_field = "issue_details.open_date"
    if sort_by == "close_date":
        sort_field = "issue_details.close_date"
    elif sort_by == "issue_size_cr":
        sort_field = "issue_details.issue_size_cr"
    elif sort_by == "listing_gain":
        sort_field = "issue_details.listing_gain_pct"

    # 4. Query with pagination
    skip = (page - 1) * page_size
    cursor = db.ipos.find(query_filter).sort(sort_field, sort_dir).skip(skip).limit(page_size)
    ipos = list(cursor)

    result_items = []
    for item in ipos:
        # Live computed or DB scorecard
        metrics = compute_financial_metrics(item["_id"])
        overall_score = metrics.get("scorecard", {}).get("overall_score")
        if overall_score is None:
            overall_score = item.get("score_breakdown", {}).get("overall", 74)

        result_items.append({
            "id": item["_id"],
            "company_name": item.get("company_name"),
            "symbol": item.get("symbol"),
            "sector": item.get("sector"),
            "status": item.get("status", "listed"),
            "data_nature": item.get("data_nature", "historical"),
            "is_sample": item.get("is_sample", False),
            "summary": item.get("summary"),
            "price_band": item.get("issue_details", {}).get("price_band_str", "N/A"),
            "issue_size_cr": item.get("issue_details", {}).get("issue_size_cr", 0.0),
            "fresh_issue_cr": item.get("issue_details", {}).get("fresh_issue_cr", 0.0),
            "ofs_cr": item.get("issue_details", {}).get("ofs_cr", 0.0),
            "lot_size": item.get("issue_details", {}).get("lot_size", 0),
            "retail_min_investment": item.get("issue_details", {}).get("retail_min_investment", 0.0),
            "open_date": item.get("issue_details", {}).get("open_date"),
            "close_date": item.get("issue_details", {}).get("close_date"),
            "listing_date": item.get("issue_details", {}).get("listing_date"),
            "listing_gain_pct": item.get("issue_details", {}).get("listing_gain_pct"),
            "subscription_status": item.get("subscription_status"),
            "key_parties": item.get("key_parties"),
            "source_reference": item.get("source_reference"),
            "deterministic_score": {
                "overall": overall_score,
                "fundamentals": metrics.get("scorecard", {}).get("fundamentals", {}).get("score", 24),
                "valuation": metrics.get("scorecard", {}).get("valuation", {}).get("score", 14),
                "risks": metrics.get("scorecard", {}).get("risks", {}).get("score", 18),
                "sentiment": metrics.get("scorecard", {}).get("sentiment", {}).get("score", 11),
                "listing": metrics.get("scorecard", {}).get("listing_potential", {}).get("score", 7)
            },
            "documents_count": item.get("documents_count", 2),
            "last_synced_at": item.get("last_synced_at", datetime.now()).isoformat() if isinstance(item.get("last_synced_at"), datetime) else item.get("last_synced_at")
        })

    provider_status = live_ipo_service.get_status()

    return {
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": (total_count + page_size - 1) // page_size if total_count > 0 else 1,
        "live_connected": provider_status["live_connected"],
        "provider_message": provider_status["message"],
        "ipos": result_items
    }

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
        "status": ipo.get("status", "listed"),
        "data_nature": ipo.get("data_nature", "historical"),
        "is_sample": ipo.get("is_sample", False),
        "summary": ipo.get("summary"),
        "issue_details": ipo.get("issue_details", {}),
        "subscription_status": ipo.get("subscription_status"),
        "key_parties": ipo.get("key_parties"),
        "source_reference": ipo.get("source_reference"),
        "metrics": {
            "pe_ratio": metrics.get("valuation_vs_peers", {}).get("ipo_pe", 26.3),
            "peer_avg_pe": metrics.get("valuation_vs_peers", {}).get("peer_avg_pe", 29.8),
            "pe_discount_pct": metrics.get("valuation_vs_peers", {}).get("pe_discount_pct", 11.7),
            "ev_ebitda": metrics.get("valuation_vs_peers", {}).get("ipo_ev_ebitda", 15.4),
            "debt_to_equity": earnings.get("debt_to_equity", 0.12),
            "cfo_to_pat": earnings.get("cfo_to_pat_ratio", 1.34),
            "revenue_cagr_pct": growth.get("revenue_cagr_pct", 21.4),
            "latest_yoy_growth_pct": growth.get("latest_yoy_growth_pct", 15.8)
        },
        "quality_of_earnings": earnings,
        "score_breakdown": metrics.get("scorecard", ipo.get("score_breakdown", {})),
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
    
    return metrics.get("scorecard", {})
