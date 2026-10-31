import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api import health, ipos, documents, research, eval

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("ipo_intelligence")

app = FastAPI(
    title="IPO Intelligence — The AI Research Terminal for IPO Investors",
    description="Evidence-first AI research terminal backend powered by MongoDB Atlas Vector Search and Gemini.",
    version="1.0.0-hackathon",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware Configuration
origins = [
    settings.FRONTEND_ORIGIN,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*" # Permissive for hackathon demo deployment across preview URLs
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers under /api/v1
app.include_router(health.router, prefix="/api/v1")
app.include_router(ipos.router, prefix="/api/v1")
app.include_router(documents.router, prefix="/api/v1")
app.include_router(research.router, prefix="/api/v1")
app.include_router(eval.router, prefix="/api/v1")

@app.get("/", tags=["Root"])
def root():
    return {
        "title": "IPO Intelligence AI Research Terminal API",
        "version": "1.0.0",
        "status": "online",
        "docs": "/docs",
        "health": "/api/v1/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.BACKEND_HOST, port=settings.BACKEND_PORT, reload=True)
