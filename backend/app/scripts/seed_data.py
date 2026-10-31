import sys
import os
import hashlib
import logging
from datetime import datetime

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from app.config import settings
from app.services.db import get_db
from app.services.pdf_processor import process_plain_text
from app.services.embedder import get_embeddings

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("seed_data")

IPO_ID = "ipo_abc_industries"
COMPANY_NAME = "ABC Industries Limited"

def seed_ipo(db):
    logger.info("Seeding master IPO record...")
    ipo_doc = {
        "_id": IPO_ID,
        "company_name": COMPANY_NAME,
        "symbol": "ABCIND",
        "sector": "Industrial Engineering & Clean Tech",
        "summary": "Engineering market leader in precision clean-tech heat transfer equipment, hydrogen-ready boiler components, and specialized alloy pressure vessels.",
        "issue_details": {
            "price_band_low": 450.0,
            "price_band_high": 475.0,
            "price_band_str": "₹450 - ₹475",
            "issue_size_cr": 1250.0,
            "fresh_issue_cr": 800.0,
            "ofs_cr": 450.0,
            "lot_size": 31,
            "open_date": "2026-11-04",
            "close_date": "2026-11-06",
            "listing_date": "2026-11-11"
        },
        "score_breakdown": {
            "overall": 74,
            "recommendation": "APPLY",
            "recommendation_horizon": "Long-Term",
            "fundamentals": 24, # out of 30
            "valuation": 14,    # out of 20
            "risks": 18,        # out of 25
            "sentiment": 11,    # out of 15
            "listing_potential": 7, # out of 10
            "key_drivers": [
                "42% YoY revenue growth in FY24 driven by renewable and hydrogen thermal expansion.",
                "Valuation (P/E 32.4x) discounted vs sector leader Thermax (58.2x).",
                "Working capital pressure resulting in negative CFO (-₹25.4 Cr) flagged as primary operational risk."
            ]
        },
        "documents_count": 3,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    db.ipos.update_one({"_id": IPO_ID}, {"$set": ipo_doc}, upsert=True)
    logger.info(f"✓ Seeded IPO: {IPO_ID}")

def seed_documents(db):
    logger.info("Seeding corpus documents and chunk embeddings...")
    corpus_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "corpus", "abc_industries"))

    sources_to_seed = [
        {
            "id": "src_drhp_abc",
            "title": "Draft Red Herring Prospectus (DRHP)",
            "file": "drhp_prospectus.txt",
            "doc_type": "drhp"
        },
        {
            "id": "src_fin_abc",
            "title": "Restated Financial Statements FY21–FY24",
            "file": "financials_restated.txt",
            "doc_type": "financials"
        },
        {
            "id": "src_broker_apex",
            "title": "Apex Capital Institutional IPO Note",
            "file": "brokerage_report.txt",
            "doc_type": "report"
        }
    ]

    for item in sources_to_seed:
        file_path = os.path.join(corpus_dir, item["file"])
        if not os.path.exists(file_path):
            logger.warning(f"File not found: {file_path}")
            continue

        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        content_hash = hashlib.sha256(content.encode("utf-8")).hexdigest()
        
        # Process and chunk text
        raw_text, chunks, sections = process_plain_text(
            text=content,
            company_name=COMPANY_NAME,
            title=item["title"],
            doc_type=item["doc_type"]
        )

        # Generate dense embeddings for all chunks in this document
        texts_for_emb = [c["text_for_embedding"] for c in chunks]
        embeddings = get_embeddings(texts_for_emb)

        # Upsert source document
        source_doc = {
            "_id": item["id"],
            "ipo_id": IPO_ID,
            "title": item["title"],
            "doc_type": item["doc_type"],
            "origin": {
                "kind": "seed",
                "filename": item["file"]
            },
            "content_hash": content_hash,
            "total_pages": max([c["page_number"] for c in chunks], default=1),
            "chunks_count": len(chunks),
            "raw_text": raw_text,
            "sections": sections,
            "status": "searchable",
            "error": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        db.sources.update_one({"_id": item["id"]}, {"$set": source_doc}, upsert=True)

        # Clear existing chunks for this source and insert newly embedded chunks
        db.chunks.delete_many({"source_id": item["id"]})
        
        chunk_docs = []
        for i, c in enumerate(chunks):
            chunk_doc = {
                "_id": f"chk_{item['id']}_{c['ordinal']:03d}",
                "ipo_id": IPO_ID,
                "source_id": item["id"],
                "ordinal": c["ordinal"],
                "page_number": c["page_number"],
                "section_title": c["section_title"],
                "text": c["text"],
                "text_for_embedding": c["text_for_embedding"],
                "char_start": c["char_start"],
                "char_end": c["char_end"],
                "token_count": c["token_count"],
                "embedding": embeddings[i],
                "embedding_model": settings.EMBEDDING_MODEL,
                "metadata": {
                    "doc_type": item["doc_type"],
                    "section": c["section_title"],
                    "page_number": c["page_number"]
                },
                "flags": [],
                "created_at": datetime.utcnow()
            }
            chunk_docs.append(chunk_doc)

        if chunk_docs:
            db.chunks.insert_many(chunk_docs)

        logger.info(f"✓ Ingested '{item['title']}': {len(chunk_docs)} chunks embedded & searchable")

def seed_financials(db):
    logger.info("Seeding structured audited financial statements...")
    fin_records = [
        {
            "_id": f"fin_{IPO_ID}_fy22",
            "ipo_id": IPO_ID,
            "fiscal_year": "FY22",
            "period_type": "Restated",
            "revenue_cr": 640.20,
            "ebitda_cr": 88.40,
            "pat_cr": 42.10,
            "cfo_cr": 54.20,
            "capex_cr": 38.50,
            "borrowings_cr": 210.00,
            "net_worth_cr": 180.40,
            "ebitda_margin_pct": 13.81,
            "pat_margin_pct": 6.58,
            "debt_to_equity": 1.16,
            "cfo_to_pat": 1.29,
            "audited": True,
            "created_at": datetime.utcnow()
        },
        {
            "_id": f"fin_{IPO_ID}_fy23",
            "ipo_id": IPO_ID,
            "fiscal_year": "FY23",
            "period_type": "Restated",
            "revenue_cr": 880.50,
            "ebitda_cr": 128.60,
            "pat_cr": 68.40,
            "cfo_cr": 72.10,
            "capex_cr": 54.20,
            "borrowings_cr": 290.00,
            "net_worth_cr": 215.80,
            "ebitda_margin_pct": 14.61,
            "pat_margin_pct": 7.77,
            "debt_to_equity": 1.34,
            "cfo_to_pat": 1.05,
            "audited": True,
            "created_at": datetime.utcnow()
        },
        {
            "_id": f"fin_{IPO_ID}_fy24",
            "ipo_id": IPO_ID,
            "fiscal_year": "FY24",
            "period_type": "Restated",
            "revenue_cr": 1250.50,
            "ebitda_cr": 180.20,
            "pat_cr": 95.10,
            "cfo_cr": -25.40, # Critical negative cash flow!
            "capex_cr": 82.10,
            "borrowings_cr": 380.50,
            "net_worth_cr": 262.40,
            "ebitda_margin_pct": 14.41,
            "pat_margin_pct": 7.60,
            "debt_to_equity": 1.45,
            "cfo_to_pat": -0.26, # Divergence metric
            "audited": True,
            "created_at": datetime.utcnow()
        }
    ]

    for r in fin_records:
        db.financials.update_one({"_id": r["_id"]}, {"$set": r}, upsert=True)
    logger.info("✓ Seeded multi-year financial statements FY22–FY24")

def seed_market_data(db):
    logger.info("Seeding market sentiment and subscription data...")
    mkt_doc = {
        "_id": f"mkt_{IPO_ID}_obs_01",
        "ipo_id": IPO_ID,
        "observed_at": datetime.utcnow(),
        "gmp_rs": 85.0,
        "gmp_pct": 17.89,
        "subscription_qib_x": 12.4,
        "subscription_nii_x": 8.1,
        "subscription_retail_x": 4.2,
        "subscription_total_x": 8.6,
        "sentiment_label": "Bullish",
        "source": "NSE/BSE Exchange Disclosures"
    }
    db.market_data.update_one({"_id": mkt_doc["_id"]}, {"$set": mkt_doc}, upsert=True)
    logger.info("✓ Seeded market subscription & GMP data")

def seed_peers(db):
    logger.info("Seeding listed peer comparisons...")
    peers = [
        {
            "_id": f"peer_{IPO_ID}_thermax",
            "ipo_id": IPO_ID,
            "peer_name": "Thermax Limited",
            "symbol": "THERMAX",
            "pe_ratio": 58.2,
            "ev_ebitda": 36.4,
            "ronw_pct": 16.8,
            "revenue_cr": 9325.0,
            "market_cap_cr": 48200.0,
            "comparison_notes": "Premium valuation due to established boiler market leadership.",
            "created_at": datetime.utcnow()
        },
        {
            "_id": f"peer_{IPO_ID}_praj",
            "ipo_id": IPO_ID,
            "peer_name": "Praj Industries Limited",
            "symbol": "PRAJIND",
            "pe_ratio": 39.4,
            "ev_ebitda": 26.2,
            "ronw_pct": 18.2,
            "revenue_cr": 3450.0,
            "market_cap_cr": 14100.0,
            "comparison_notes": "Leader in biofuels and industrial process equipment.",
            "created_at": datetime.utcnow()
        },
        {
            "_id": f"peer_{IPO_ID}_kirloskar",
            "ipo_id": IPO_ID,
            "peer_name": "Kirloskar Oil Engines",
            "symbol": "KOEL",
            "pe_ratio": 24.5,
            "ev_ebitda": 15.8,
            "ronw_pct": 14.6,
            "revenue_cr": 5120.0,
            "market_cap_cr": 11800.0,
            "comparison_notes": "Lower valuation multiple reflecting mature engineering segment.",
            "created_at": datetime.utcnow()
        }
    ]

    for p in peers:
        db.peers.update_one({"_id": p["_id"]}, {"$set": p}, upsert=True)
    logger.info("✓ Seeded listed competitors")

def seed_eval_cases(db):
    logger.info("Seeding golden evaluation cases...")
    eval_cases = [
        {
            "_id": "ev_001_multi_source",
            "ipo_id": IPO_ID,
            "question": "What is the issue size and how will proceeds be utilized alongside outstanding borrowings?",
            "category": "multi-source",
            "expected_source_ids": ["src_drhp_abc", "src_fin_abc"],
            "expected_state": "ANSWERED",
            "must_contain": ["1250", "800", "350", "Sanand", "380.50"],
            "notes": "Requires synthesizing DRHP Section I & II with Financial Statement borrowings."
        },
        {
            "_id": "ev_002_planted_conflict",
            "ipo_id": IPO_ID,
            "question": "An equity report claims the company generated strong positive operating cash flows in FY24. What does the audited prospectus show?",
            "category": "conflict",
            "expected_source_ids": ["src_broker_apex", "src_drhp_abc", "src_fin_abc"],
            "expected_state": "CONFLICTING",
            "must_contain": ["negative", "25.4", "120", "receivables"],
            "notes": "Tests conflict detection between Apex Capital (+₹120 Cr) and DRHP (-₹25.4 Cr)."
        },
        {
            "_id": "ev_003_unanswerable",
            "ipo_id": IPO_ID,
            "question": "Will this IPO list at a guaranteed 35% premium on listing day?",
            "category": "unanswerable",
            "expected_source_ids": [],
            "expected_state": "INSUFFICIENT",
            "must_contain": ["cannot guarantee", "listing premium", "market risk"],
            "notes": "Tests honest abstention on speculative future listing questions."
        },
        {
            "_id": "ev_004_exact_token",
            "ipo_id": IPO_ID,
            "question": "What is the contingent liability related to pending ITAT direct tax litigation?",
            "category": "exact-token",
            "expected_source_ids": ["src_drhp_abc"],
            "expected_state": "ANSWERED",
            "must_contain": ["ITAT", "14.20", "direct tax"],
            "notes": "Tests exact token matching for legal and tax proceedings."
        },
        {
            "_id": "ev_005_customer_concentration",
            "ipo_id": IPO_ID,
            "question": "What percentage of revenue comes from top customers and does it pose a risk?",
            "category": "multi-source",
            "expected_source_ids": ["src_drhp_abc"],
            "expected_state": "ANSWERED",
            "must_contain": ["68.4", "top three", "38.15"],
            "notes": "Tests risk extraction on customer vulnerability."
        }
    ]

    for ev in eval_cases:
        db.eval_cases.update_one({"_id": ev["_id"]}, {"$set": ev}, upsert=True)
    logger.info(f"✓ Seeded {len(eval_cases)} evaluation benchmark cases")

def seed_additional_ipos(db):
    logger.info("Seeding additional IPO records for comparative research...")
    
    # 2. Zenith Cloud & AI Technologies (Upcoming)
    zenith_id = "ipo_zenith_technologies"
    zenith_doc = {
        "_id": zenith_id,
        "company_name": "Zenith Cloud & AI Technologies Limited",
        "symbol": "ZENITHAI",
        "sector": "Enterprise SaaS & AI Infrastructure",
        "summary": "Cloud-native AI analytics platform providing predictive maintenance and LLM deployment pipelines for Global 2000 enterprises.",
        "issue_details": {
            "price_band_low": 620.0,
            "price_band_high": 655.0,
            "price_band_str": "₹620 - ₹655",
            "issue_size_cr": 850.0,
            "fresh_issue_cr": 600.0,
            "ofs_cr": 250.0,
            "lot_size": 22,
            "open_date": "2026-11-12",
            "close_date": "2026-11-15",
            "listing_date": "2026-11-20"
        },
        "score_breakdown": {
            "overall": 81,
            "recommendation": "APPLY",
            "recommendation_horizon": "Long-Term",
            "fundamentals": 27,
            "valuation": 15,
            "risks": 21,
            "sentiment": 13,
            "listing_potential": 8,
            "key_drivers": [
                "Net Dollar Retention Rate of 124% across recurring enterprise software subscriptions.",
                "High gross margins (74.5%) with positive Free Cash Flow generation.",
                "Valuation multiple (P/E 48.5x) justified by 52% ARR expansion."
            ]
        },
        "documents_count": 2,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    db.ipos.update_one({"_id": zenith_id}, {"$set": zenith_doc}, upsert=True)

    # Financials for Zenith
    zenith_fin = [
        {"ipo_id": zenith_id, "fiscal_year": "FY22", "revenue_operations_cr": 180.0, "total_income_cr": 184.5, "ebitda_cr": 36.0, "ebitda_margin_pct": 20.0, "pat_cr": 24.5, "pat_margin_pct": 13.6, "eps_restated": 5.4, "cash_flow_operating_cr": 28.0, "capex_cr": 8.0, "free_cash_flow_cr": 20.0, "net_worth_cr": 140.0, "total_debt_cr": 25.0, "debt_to_equity": 0.18, "ronw_pct": 17.5},
        {"ipo_id": zenith_id, "fiscal_year": "FY23", "revenue_operations_cr": 285.0, "total_income_cr": 291.0, "ebitda_cr": 68.4, "ebitda_margin_pct": 24.0, "pat_cr": 48.0, "pat_margin_pct": 16.8, "eps_restated": 8.2, "cash_flow_operating_cr": 54.0, "capex_cr": 12.0, "free_cash_flow_cr": 42.0, "net_worth_cr": 210.0, "total_debt_cr": 20.0, "debt_to_equity": 0.10, "ronw_pct": 22.8},
        {"ipo_id": zenith_id, "fiscal_year": "FY24", "revenue_operations_cr": 445.0, "total_income_cr": 452.0, "ebitda_cr": 118.0, "ebitda_margin_pct": 26.5, "pat_cr": 82.5, "pat_margin_pct": 18.5, "eps_restated": 13.5, "cash_flow_operating_cr": 92.0, "capex_cr": 15.0, "free_cash_flow_cr": 77.0, "net_worth_cr": 320.0, "total_debt_cr": 15.0, "debt_to_equity": 0.05, "ronw_pct": 25.8}
    ]
    for fin in zenith_fin:
        db.financials.update_one({"ipo_id": zenith_id, "fiscal_year": fin["fiscal_year"]}, {"$set": fin}, upsert=True)

    # Peers for Zenith
    zenith_peers = [
        {"ipo_id": zenith_id, "peer_name": "Tata Elxsi", "pe_ratio": 54.2, "ev_ebitda": 38.5, "ronw_pct": 28.4, "revenue_cr": 3550.0, "market_cap_cr": 42000.0},
        {"ipo_id": zenith_id, "peer_name": "Persistent Systems", "pe_ratio": 46.8, "ev_ebitda": 29.4, "ronw_pct": 22.1, "revenue_cr": 9820.0, "market_cap_cr": 68000.0},
        {"ipo_id": zenith_id, "peer_name": "KPIT Technologies", "pe_ratio": 52.0, "ev_ebitda": 34.1, "ronw_pct": 24.5, "revenue_cr": 4850.0, "market_cap_cr": 39500.0}
    ]
    for p in zenith_peers:
        db.peers.update_one({"ipo_id": zenith_id, "peer_name": p["peer_name"]}, {"$set": p}, upsert=True)

    # 3. SolarGrid Infrastructure Limited (Closed / Listed)
    solargrid_id = "ipo_solar_grid_infra"
    solargrid_doc = {
        "_id": solargrid_id,
        "company_name": "SolarGrid Infrastructure Limited",
        "symbol": "SOLARGRID",
        "sector": "Renewable Power & Transmission",
        "summary": "Turnkey EPC infrastructure developer executing high-voltage solar evacuation sub-stations and grid-scale battery storage installations.",
        "issue_details": {
            "price_band_low": 210.0,
            "price_band_high": 225.0,
            "price_band_str": "₹210 - ₹225",
            "issue_size_cr": 1800.0,
            "fresh_issue_cr": 1400.0,
            "ofs_cr": 400.0,
            "lot_size": 65,
            "open_date": "2026-10-14",
            "close_date": "2026-10-17",
            "listing_date": "2026-10-22"
        },
        "score_breakdown": {
            "overall": 68,
            "recommendation": "NEUTRAL",
            "recommendation_horizon": "Listing Pop",
            "fundamentals": 20,
            "valuation": 16,
            "risks": 15,
            "sentiment": 10,
            "listing_potential": 7,
            "key_drivers": [
                "Backed by a ₹4,200 Cr confirmed transmission order backlog across 6 states.",
                "High leverage with Debt-to-Equity of 1.45x requires substantial interest servicing.",
                "Modest net margins (6.8%) vulnerable to commodity price inflation in copper and aluminum."
            ]
        },
        "documents_count": 2,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    db.ipos.update_one({"_id": solargrid_id}, {"$set": solargrid_doc}, upsert=True)

    # Financials for SolarGrid
    solargrid_fin = [
        {"ipo_id": solargrid_id, "fiscal_year": "FY22", "revenue_operations_cr": 1150.0, "total_income_cr": 1162.0, "ebitda_cr": 138.0, "ebitda_margin_pct": 12.0, "pat_cr": 58.0, "pat_margin_pct": 5.0, "eps_restated": 4.8, "cash_flow_operating_cr": 72.0, "capex_cr": 45.0, "free_cash_flow_cr": 27.0, "net_worth_cr": 680.0, "total_debt_cr": 1020.0, "debt_to_equity": 1.50, "ronw_pct": 8.5},
        {"ipo_id": solargrid_id, "fiscal_year": "FY23", "revenue_operations_cr": 1620.0, "total_income_cr": 1638.0, "ebitda_cr": 210.6, "ebitda_margin_pct": 13.0, "pat_cr": 92.0, "pat_margin_pct": 5.7, "eps_restated": 6.9, "cash_flow_operating_cr": 110.0, "capex_cr": 60.0, "free_cash_flow_cr": 50.0, "net_worth_cr": 820.0, "total_debt_cr": 1180.0, "debt_to_equity": 1.44, "ronw_pct": 11.2},
        {"ipo_id": solargrid_id, "fiscal_year": "FY24", "revenue_operations_cr": 2340.0, "total_income_cr": 2365.0, "ebitda_cr": 327.6, "ebitda_margin_pct": 14.0, "pat_cr": 158.0, "pat_margin_pct": 6.8, "eps_restated": 9.8, "cash_flow_operating_cr": 145.0, "capex_cr": 85.0, "free_cash_flow_cr": 60.0, "net_worth_cr": 1050.0, "total_debt_cr": 1420.0, "debt_to_equity": 1.35, "ronw_pct": 15.0}
    ]
    for fin in solargrid_fin:
        db.financials.update_one({"ipo_id": solargrid_id, "fiscal_year": fin["fiscal_year"]}, {"$set": fin}, upsert=True)

    # Peers for SolarGrid
    solargrid_peers = [
        {"ipo_id": solargrid_id, "peer_name": "Sterling & Wilson", "pe_ratio": 34.5, "ev_ebitda": 22.0, "ronw_pct": 9.2, "revenue_cr": 3120.0, "market_cap_cr": 7200.0},
        {"ipo_id": solargrid_id, "peer_name": "Tata Power", "pe_ratio": 31.8, "ev_ebitda": 15.4, "ronw_pct": 12.8, "revenue_cr": 56000.0, "market_cap_cr": 128000.0},
        {"ipo_id": solargrid_id, "peer_name": "Adani Energy Sol", "pe_ratio": 42.0, "ev_ebitda": 19.8, "ronw_pct": 14.2, "revenue_cr": 14200.0, "market_cap_cr": 98000.0}
    ]
    for p in solargrid_peers:
        db.peers.update_one({"ipo_id": solargrid_id, "peer_name": p["peer_name"]}, {"$set": p}, upsert=True)

def main():
    logger.info("Starting Milestone 3 seed data loading...")
    db = get_db()
    
    seed_ipo(db)
    seed_documents(db)
    seed_financials(db)
    seed_market_data(db)
    seed_peers(db)
    seed_eval_cases(db)
    seed_additional_ipos(db)

    logger.info("==================================================")
    logger.info("✓ Milestone 3 Ingestion & Seed Data Loaded Successfully!")
    logger.info("==================================================")

if __name__ == "__main__":
    main()
