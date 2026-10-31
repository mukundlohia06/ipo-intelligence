import os
from pathlib import Path
from typing import Optional, List
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

# Reliable absolute directory resolution regardless of where uvicorn is launched
BACKEND_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = BACKEND_DIR.parent

ENV_FILES: List[Path] = [
    BACKEND_DIR / ".env",
    REPO_ROOT / ".env"
]

# Explicitly load into process environment
for env_path in ENV_FILES:
    if env_path.exists():
        load_dotenv(dotenv_path=env_path, override=True)

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=[str(p) for p in ENV_FILES if p.exists()] or (".env",),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    ENVIRONMENT: str = "development"
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000
    PORT: Optional[int] = None
    FRONTEND_ORIGIN: str = "http://localhost:3000"

    @property
    def effective_port(self) -> int:
        port_env = os.environ.get("PORT")
        if port_env and port_env.isdigit():
            return int(port_env)
        return self.PORT or self.BACKEND_PORT

    # MongoDB Atlas
    MONGODB_URI: str = Field(default="mongodb://localhost:27017")
    MONGODB_DB: str = Field(default="ipo_intelligence")

    # LLM Provider & Google Gemini API
    LLM_PROVIDER: str = "gemini"
    GEMINI_API_KEY: Optional[str] = None
    LLM_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-3.5-flash-lite"
    LLM_MODEL: str = "gemini-3.5-flash-lite"
    GEMINI_TEMPERATURE: float = 0.3
    GEMINI_MAX_OUTPUT_TOKENS: int = 4096

    # Embedding Provider
    EMBEDDING_PROVIDER: str = "gemini"
    EMBEDDING_API_KEY: Optional[str] = None
    EMBEDDING_MODEL: str = "text-embedding-004"
    EMBEDDING_DIMENSIONS: int = 768

    # Optional Reranker
    RERANKER_PROVIDER: Optional[str] = None
    RERANKER_API_KEY: Optional[str] = None
    RERANKER_MODEL: Optional[str] = None

    # Administration
    ADMIN_TOKEN: str = "dev_admin_token_2026"
    RATE_LIMIT_PER_MIN: int = 60

    @property
    def effective_gemini_key(self) -> Optional[str]:
        # Check settings first, then os.environ directly as safety net
        return self.GEMINI_API_KEY or self.LLM_API_KEY or os.environ.get("GEMINI_API_KEY") or os.environ.get("LLM_API_KEY")

    @property
    def effective_embedding_key(self) -> Optional[str]:
        return (
            self.EMBEDDING_API_KEY
            or self.effective_gemini_key
            or os.environ.get("EMBEDDING_API_KEY")
        )

settings = Settings()
