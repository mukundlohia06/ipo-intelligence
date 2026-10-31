import time
import logging
from typing import Optional, Dict, Any
from pymongo import MongoClient
from pymongo.database import Database
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from app.config import settings

logger = logging.getLogger(__name__)

_mongo_client: Optional[MongoClient] = None

def get_mongo_client() -> MongoClient:
    global _mongo_client
    if _mongo_client is None:
        try:
            logger.info("Initializing MongoDB client...")
            _mongo_client = MongoClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=3000,
                connectTimeoutMS=3000,
                retryWrites=True
            )
        except Exception as e:
            logger.error(f"Failed to create MongoClient: {e}")
            raise
    return _mongo_client

def get_db() -> Database:
    client = get_mongo_client()
    return client[settings.MONGODB_DB]

def check_db_connection() -> Dict[str, Any]:
    start_time = time.time()
    try:
        client = get_mongo_client()
        # The ping command is cheap and does not require auth on most setups
        client.admin.command('ping')
        latency_ms = round((time.time() - start_time) * 1000, 2)
        return {
            "status": "connected",
            "database": settings.MONGODB_DB,
            "latency_ms": latency_ms
        }
    except (ConnectionFailure, ServerSelectionTimeoutError) as e:
        logger.warning(f"MongoDB connection check failed: {e}")
        return {
            "status": "disconnected",
            "database": settings.MONGODB_DB,
            "error": str(e)
        }
    except Exception as e:
        logger.warning(f"Unexpected MongoDB error during ping: {e}")
        return {
            "status": "error",
            "database": settings.MONGODB_DB,
            "error": str(e)
        }
