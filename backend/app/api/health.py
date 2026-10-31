import datetime
from fastapi import APIRouter
from app.config import settings
from app.services.db import check_db_connection

router = APIRouter(prefix="/health", tags=["Health & Status"])

@router.get("", summary="System Health & Readiness")
async def health_check():
    db_status = check_db_connection()
    
    provider_configured = bool(settings.effective_gemini_key)
    embedding_configured = bool(settings.effective_embedding_key)

    is_ready = db_status.get("status") == "connected"

    return {
        "status": "online",
        "service": "IPO Intelligence AI Research Terminal API",
        "version": "1.0.0-hackathon",
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "environment": settings.ENVIRONMENT,
        "database": db_status,
        "providers": {
            "llm": {
                "provider": settings.LLM_PROVIDER,
                "model": settings.LLM_MODEL,
                "configured": provider_configured
            },
            "embedding": {
                "provider": settings.EMBEDDING_PROVIDER,
                "model": settings.EMBEDDING_MODEL,
                "dimensions": settings.EMBEDDING_DIMENSIONS,
                "configured": embedding_configured
            }
        },
        "ready": is_ready
    }
