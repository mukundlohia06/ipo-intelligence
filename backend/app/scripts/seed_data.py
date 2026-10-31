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

def main():
    logger.info("Starting Milestone 3 seed data loading...")
    db = get_db()
    
    seed_ipo(db)
    seed_documents(db)
    seed_financials(db)
    seed_market_data(db)
    seed_peers(db)
    seed_eval_cases(db)

    logger.info("==================================================")
    logger.info("✓ Milestone 3 Ingestion & Seed Data Loaded Successfully!")
    logger.info("==================================================")

if __name__ == "__main__":
    main()
