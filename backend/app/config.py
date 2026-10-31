import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from typing import Optional

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    ENVIRONMENT: str = "development"
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000
    FRONTEND_ORIGIN: str = "http://localhost:3000"

    # MongoDB Atlas
    MONGODB_URI: str = Field(default="mongodb://localhost:27017")
    MONGODB_DB: str = Field(default="ipo_intelligence")

    # LLM Provider & Google Gemini API
    LLM_PROVIDER: str = "gemini"
    GEMINI_API_KEY: Optional[str] = None
    LLM_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-2.5-flash"
    LLM_MODEL: str = "gemini-2.5-flash"
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
        return self.GEMINI_API_KEY or self.LLM_API_KEY

    @property
    def effective_embedding_key(self) -> Optional[str]:
        return self.EMBEDDING_API_KEY or self.GEMINI_API_KEY or self.LLM_API_KEY

settings = Settings()
