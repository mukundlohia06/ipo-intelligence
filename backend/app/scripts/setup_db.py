import sys
import os
import logging

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from app.config import settings
from app.services.db import get_mongo_client, get_db
from pymongo.errors import OperationFailure, CollectionInvalid

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("setup_db")

COLLECTIONS = [
    "ipos",
    "sources",
    "chunks",
    "financials",
    "market_data",
    "peers",
    "queries",
    "eval_cases",
    "eval_runs"
]

def setup_collections(db):
    logger.info("Setting up MongoDB collections...")
    existing_collections = db.list_collection_names()
    
    for coll_name in COLLECTIONS:
        if coll_name not in existing_collections:
            try:
                db.create_collection(coll_name)
                logger.info(f"✓ Created collection: {coll_name}")
            except CollectionInvalid:
                logger.info(f"Collection already exists: {coll_name}")
        else:
            logger.info(f"✓ Existing collection: {coll_name}")

def setup_regular_indexes(db):
    logger.info("Setting up standard B-Tree and Unique indexes...")

    # sources collection indexes
    db.sources.create_index([("ipo_id", 1), ("content_hash", 1)], unique=True, name="idx_sources_ipo_hash_unique")
    db.sources.create_index([("ipo_id", 1), ("status", 1)], name="idx_sources_ipo_status")
    logger.info("✓ sources indexes created")

    # chunks collection indexes
    db.chunks.create_index([("source_id", 1), ("ordinal", 1)], name="idx_chunks_source_ordinal")
    db.chunks.create_index([("ipo_id", 1)], name="idx_chunks_ipo")
    db.chunks.create_index([("ipo_id", 1), ("page_number", 1)], name="idx_chunks_ipo_page")
    logger.info("✓ chunks indexes created")

    # financials collection indexes
    db.financials.create_index([("ipo_id", 1), ("fiscal_year", 1)], unique=True, name="idx_financials_ipo_fy_unique")
    logger.info("✓ financials indexes created")

    # peers collection indexes
    db.peers.create_index([("ipo_id", 1), ("peer_name", 1)], name="idx_peers_ipo_peername")
    logger.info("✓ peers indexes created")

    # queries collection indexes
    db.queries.create_index([("ipo_id", 1), ("created_at", -1)], name="idx_queries_ipo_created")
    logger.info("✓ queries indexes created")

    # eval_cases collection indexes (note: _id is already uniquely indexed by MongoDB)
    db.eval_cases.create_index([("ipo_id", 1), ("category", 1)], name="idx_eval_cases_ipo_cat")
    logger.info("✓ eval_cases indexes created")

def setup_atlas_search_indexes(db):
    logger.info("Configuring Atlas Search & Vector Search index definitions...")
    
    vector_index_name = "chunks_vector"
    vector_model = {
        "fields": [
            {
                "type": "vector",
                "path": "embedding",
                "numDimensions": settings.EMBEDDING_DIMENSIONS,
                "similarity": "cosine"
            },
            { "type": "filter", "path": "ipo_id" },
            { "type": "filter", "path": "source_id" },
            { "type": "filter", "path": "page_number" },
            { "type": "filter", "path": "metadata.doc_type" },
            { "type": "filter", "path": "metadata.financial_year" }
        ]
    }

    text_index_name = "chunks_text"
    text_model = {
        "mappings": {
            "dynamic": False,
            "fields": {
                "text": { "type": "string", "analyzer": "lucene.standard" },
                "section_title": { "type": "string", "analyzer": "lucene.standard" },
                "ipo_id": { "type": "token" },
                "source_id": { "type": "token" },
                "metadata": {
                    "type": "document",
                    "fields": {
                        "doc_type": { "type": "token" },
                        "financial_year": { "type": "token" }
                    }
                }
            }
        }
    }

    # Attempt index creation via PyMongo 4.5+ Search Index API
    try:
        from pymongo.operations import SearchIndexModel
        
        existing_indexes = []
        try:
            cursor = db.chunks.list_search_indexes()
            existing_indexes = [idx["name"] for idx in cursor]
        except Exception:
            pass

        # 1. Vector Search Index
        if vector_index_name not in existing_indexes:
            try:
                db.chunks.create_search_index(SearchIndexModel(
                    definition=vector_model,
                    name=vector_index_name,
                    type="vectorSearch"
                ))
                logger.info(f"✓ Created Atlas Vector Search index: {vector_index_name} (dims: {settings.EMBEDDING_DIMENSIONS})")
            except OperationFailure as e:
                logger.warning(f"Note: Atlas Vector Search index creation returned: {e.details if hasattr(e, 'details') else e}")
                logger.info("In Atlas Free Tier / Local Mongo, vector search definitions can be created via Atlas Search UI or run with vector fallback.")
        else:
            logger.info(f"✓ Atlas Vector Search index already exists: {vector_index_name}")

        # 2. Text Search Index
        if text_index_name not in existing_indexes:
            try:
                db.chunks.create_search_index(SearchIndexModel(
                    definition=text_model,
                    name=text_index_name
                ))
                logger.info(f"✓ Created Atlas Lexical Search index: {text_index_name}")
            except OperationFailure as e:
                logger.warning(f"Note: Atlas Text Search index creation returned: {e.details if hasattr(e, 'details') else e}")
        else:
            logger.info(f"✓ Atlas Text Search index already exists: {text_index_name}")

    except Exception as e:
        logger.info(f"Atlas Search Index programmatic setup note: {e}")

def main():
    logger.info(f"Connecting to MongoDB database '{settings.MONGODB_DB}'...")
    db = get_db()
    
    setup_collections(db)
    setup_regular_indexes(db)
    setup_atlas_search_indexes(db)
    
    logger.info("==================================================")
    logger.info("✓ Milestone 2 Database Setup Completed Successfully!")
    logger.info("==================================================")

if __name__ == "__main__":
    main()
