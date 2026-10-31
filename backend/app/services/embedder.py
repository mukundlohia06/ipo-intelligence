import hashlib
import logging
import math
from typing import List, Optional
from app.config import settings

logger = logging.getLogger("embedder")

# In-memory embedding cache: sha256(text + model) -> list of floats
_EMBEDDING_CACHE = {}

def _deterministic_pseudo_embedding(text: str, dim: int = 768) -> List[float]:
    """
    Generates a deterministic, normalized dense vector from text.
    Used for local testing or when external API keys are not supplied.
    Ensures cosine similarity is semantically consistent for matching tokens.
    """
    words = text.lower().split()
    vec = [0.0] * dim
    
    for i, word in enumerate(words):
        h = int(hashlib.md5(word.encode("utf-8")).hexdigest(), 16)
        pos = h % dim
        sign = 1.0 if ((h >> 8) & 1) else -1.0
        vec[pos] += sign * (1.0 / math.sqrt(i + 1))
        # Add bigram influence
        if i > 0:
            bi = f"{words[i-1]}_{word}"
            h_bi = int(hashlib.sha256(bi.encode("utf-8")).hexdigest(), 16)
            vec[h_bi % dim] += (1.0 if ((h_bi >> 8) & 1) else -1.0) * 0.5

    # L2 normalize
    norm = math.sqrt(sum(x * x for x in vec))
    if norm > 0:
        vec = [round(x / norm, 6) for x in vec]
    else:
        vec[0] = 1.0
    return vec

def get_embeddings(texts: List[str], is_query: bool = False) -> List[List[float]]:
    """
    Batch generate embeddings for a list of strings.
    Uses Gemini API if configured; otherwise falls back to deterministic vector generator.
    """
    dim = settings.EMBEDDING_DIMENSIONS
    results: List[List[float]] = []
    texts_to_fetch_indices = []
    texts_to_fetch = []

    for i, text in enumerate(texts):
        cache_key = hashlib.sha256(f"{settings.EMBEDDING_MODEL}:{text}".encode("utf-8")).hexdigest()
        if cache_key in _EMBEDDING_CACHE:
            results.append(_EMBEDDING_CACHE[cache_key])
        else:
            results.append([])
            texts_to_fetch_indices.append(i)
            texts_to_fetch.append(text)

    if not texts_to_fetch:
        return results

    api_key = settings.effective_embedding_key
    if api_key and settings.EMBEDDING_PROVIDER == "gemini":
        try:
            from google import genai
            from google.genai import types
            
            client = genai.Client(api_key=api_key)
            task_type = "RETRIEVAL_QUERY" if is_query else "RETRIEVAL_DOCUMENT"
            
            # Batch in chunks of 64
            batch_size = 64
            for b_start in range(0, len(texts_to_fetch), batch_size):
                b_texts = texts_to_fetch[b_start:b_start + batch_size]
                response = client.models.embed_content(
                    model=settings.EMBEDDING_MODEL,
                    contents=b_texts,
                    config=types.EmbedContentConfig(
                        task_type=task_type,
                        output_dimensionality=dim
                    )
                )
                for j, emb in enumerate(response.embeddings):
                    orig_idx = texts_to_fetch_indices[b_start + j]
                    vec = emb.values
                    results[orig_idx] = vec
                    c_key = hashlib.sha256(f"{settings.EMBEDDING_MODEL}:{texts_to_fetch[b_start + j]}".encode("utf-8")).hexdigest()
                    _EMBEDDING_CACHE[c_key] = vec

            logger.info(f"Generated {len(texts_to_fetch)} embeddings via Google Gemini API ({settings.EMBEDDING_MODEL})")
            return results
        except Exception as e:
            logger.warning(f"Gemini embedding API call failed: {e}. Falling back to deterministic dense embeddings.")

    # Fallback to deterministic pseudo-embeddings
    for idx, text in zip(texts_to_fetch_indices, texts_to_fetch):
        vec = _deterministic_pseudo_embedding(text, dim=dim)
        results[idx] = vec
        c_key = hashlib.sha256(f"{settings.EMBEDDING_MODEL}:{text}".encode("utf-8")).hexdigest()
        _EMBEDDING_CACHE[c_key] = vec

    return results

def get_query_embedding(query: str) -> List[float]:
    """Generates embedding for a single search query."""
    return get_embeddings([query], is_query=True)[0]
