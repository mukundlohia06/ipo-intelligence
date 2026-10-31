import time
import math
import re
from typing import List, Dict, Any, Tuple
from app.config import settings
from app.services.db import get_db
from app.services.embedder import get_query_embedding

def _cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """Computes cosine similarity between two normalized or raw float lists."""
    if not vec_a or not vec_b or len(vec_a) != len(vec_b):
        return 0.0
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a, b in zip(vec_a, vec_a)))
    norm_b = math.sqrt(sum(b * b for a, b in zip(vec_b, vec_b)))
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return dot / (norm_a * norm_b)

def _bm25_text_score(query: str, text: str, title: str = "") -> float:
    """Calculates term-matching BM25 approximation for exact tokens & identifiers."""
    query_tokens = [t.lower() for t in re.findall(r'\b\w+\b', query)]
    if not query_tokens:
        return 0.0
    
    combined_text = f"{title} {text}".lower()
    score = 0.0
    
    for token in query_tokens:
        count = len(re.findall(r'\b' + re.escape(token) + r'\b', combined_text))
        if count > 0:
            # Term frequency saturation
            tf = (count * 2.2) / (count + 1.2)
            # Boost matches in section titles or numerical tokens (financial figures)
            is_numeric = any(char.isdigit() for char in token)
            weight = 2.5 if (token in title.lower() or is_numeric) else 1.0
            score += tf * weight
            
    return score

def hybrid_retrieve(
    ipo_id: Optional[str] = None,
    doc_id: Optional[str] = None,
    query: str = "",
    top_k: int = 8,
    per_source_cap: int = 4
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], Dict[str, float]]:
    """
    Executes hybrid retrieval (Vector + Lexical) with Reciprocal Rank Fusion (k=60)
    and multi-source diversification. Supports strict document-level isolation (doc_id).
    
    Returns:
      (fused_chunks, trace_items, latencies_dict)
    """
    latencies = {}
    db = get_db()
    
    # 1. Query Embedding
    t0 = time.time()
    query_vec = get_query_embedding(query)
    latencies["embed_ms"] = round((time.time() - t0) * 1000, 2)

    # Build DB filter
    chunk_filter: Dict[str, Any] = {}
    if ipo_id and ipo_id.lower() not in ("all", ""):
        chunk_filter["ipo_id"] = ipo_id
    if doc_id:
        chunk_filter["source_id"] = doc_id

    # 2. Vector Search (Atlas $vectorSearch with fallback)
    t1 = time.time()
    vector_candidates: List[Dict[str, Any]] = []
    
    try:
        pipeline = [
            {
                "$vectorSearch": {
                    "index": "chunks_vector",
                    "path": "embedding",
                    "queryVector": query_vec,
                    "numCandidates": 200,
                    "limit": 30,
                    "filter": chunk_filter
                }
            },
            {
                "$project": {
                    "score": {"$meta": "vectorSearchScore"},
                    "ipo_id": 1,
                    "source_id": 1,
                    "ordinal": 1,
                    "page_number": 1,
                    "section_title": 1,
                    "text": 1,
                    "char_start": 1,
                    "char_end": 1
                }
            }
        ]
        results = list(db.chunks.aggregate(pipeline))
        for r in results:
            vector_candidates.append({
                "chunk_id": str(r["_id"]),
                "doc": r,
                "score": float(r.get("score", 0.0))
            })
    except Exception:
        # Fallback to in-app cosine similarity over stored chunk embeddings
        all_chunks = list(db.chunks.find(chunk_filter))
        scored = []
        for chk in all_chunks:
            emb = chk.get("embedding")
            if emb:
                sim = _cosine_similarity(query_vec, emb)
                scored.append({"chunk_id": str(chk["_id"]), "doc": chk, "score": sim})
        scored.sort(key=lambda x: x["score"], reverse=True)
        vector_candidates = scored[:30]

    latencies["vector_ms"] = round((time.time() - t1) * 1000, 2)

    # 3. Lexical Search (Atlas $search BM25 with fallback)
    t2 = time.time()
    lexical_candidates: List[Dict[str, Any]] = []

    try:
        search_filter = []
        if ipo_id and ipo_id.lower() not in ("all", ""):
            search_filter.append({"equals": {"path": "ipo_id", "value": ipo_id}})
        if doc_id:
            search_filter.append({"equals": {"path": "source_id", "value": doc_id}})

        pipeline = [
            {
                "$search": {
                    "index": "chunks_text",
                    "compound": {
                        "must": [
                            {
                                "text": {
                                    "query": query,
                                    "path": ["text", "section_title"]
                                }
                            }
                        ],
                        "filter": search_filter
                    }
                }
            },
            {"$limit": 30},
            {
                "$project": {
                    "score": {"$meta": "searchScore"},
                    "ipo_id": 1,
                    "source_id": 1,
                    "ordinal": 1,
                    "page_number": 1,
                    "section_title": 1,
                    "text": 1,
                    "char_start": 1,
                    "char_end": 1
                }
            }
        ]
        results = list(db.chunks.aggregate(pipeline))
        for r in results:
            lexical_candidates.append({
                "chunk_id": str(r["_id"]),
                "doc": r,
                "score": float(r.get("score", 0.0))
            })
    except Exception:
        # Fallback to in-app BM25 scoring over chunks matching filter
        all_chunks = list(db.chunks.find(chunk_filter))
        scored = []
        for chk in all_chunks:
            s = _bm25_text_score(query, chk.get("text", ""), chk.get("section_title", ""))
            if s > 0:
                scored.append({"chunk_id": str(chk["_id"]), "doc": chk, "score": s})
        scored.sort(key=lambda x: x["score"], reverse=True)
        lexical_candidates = scored[:30]

    latencies["lexical_ms"] = round((time.time() - t2) * 1000, 2)

    # 4. Reciprocal Rank Fusion (RRF, k=60)
    t3 = time.time()
    rrf_constant = 60.0
    fused_scores: Dict[str, Dict[str, Any]] = {}

    # Index vector ranks
    for rank_idx, c in enumerate(vector_candidates):
        cid = c["chunk_id"]
        rank = rank_idx + 1
        rrf_contrib = 1.0 / (rrf_constant + rank)
        fused_scores[cid] = {
            "chunk_id": cid,
            "doc": c["doc"],
            "vector_rank": rank,
            "vector_score": round(c["score"], 4),
            "lexical_rank": None,
            "lexical_score": None,
            "rrf_score": rrf_contrib
        }

    # Index lexical ranks and add fusion contribution
    for rank_idx, c in enumerate(lexical_candidates):
        cid = c["chunk_id"]
        rank = rank_idx + 1
        rrf_contrib = 1.0 / (rrf_constant + rank)
        if cid in fused_scores:
            fused_scores[cid]["lexical_rank"] = rank
            fused_scores[cid]["lexical_score"] = round(c["score"], 4)
            fused_scores[cid]["rrf_score"] += rrf_contrib
        else:
            fused_scores[cid] = {
                "chunk_id": cid,
                "doc": c["doc"],
                "vector_rank": None,
                "vector_score": None,
                "lexical_rank": rank,
                "lexical_score": round(c["score"], 4),
                "rrf_score": rrf_contrib
            }

    # Sort all candidates by descending RRF score
    all_fused = sorted(fused_scores.values(), key=lambda x: x["rrf_score"], reverse=True)

    # 5. Multi-Source Diversification (Max cap per source)
    selected_chunks = []
    trace_items = []
    source_counts: Dict[str, int] = {}

    for item in all_fused:
        doc = item["doc"]
        source_id = doc.get("source_id", "unknown")
        current_count = source_counts.get(source_id, 0)

        # Allow chunk if source cap not reached, or if we haven't reached top_k
        if current_count < per_source_cap or len(selected_chunks) < 3:
            source_counts[source_id] = current_count + 1
            selected_chunks.append(doc)
            
            trace_items.append({
                "chunk_id": item["chunk_id"],
                "source_id": source_id,
                "page_number": doc.get("page_number", 1),
                "section_title": doc.get("section_title", "General"),
                "vector_rank": item["vector_rank"],
                "vector_score": item["vector_score"],
                "lexical_rank": item["lexical_rank"],
                "lexical_score": item["lexical_score"],
                "rrf_score": round(item["rrf_score"], 5),
                "diversified": (current_count > 0)
            })

        if len(selected_chunks) >= top_k:
            break

    latencies["fuse_ms"] = round((time.time() - t3) * 1000, 2)
    latencies["total_retrieve_ms"] = round(sum(latencies.values()), 2)

    return selected_chunks, trace_items, latencies

def evaluate_sufficiency_gate(
    query: str,
    selected_chunks: List[Dict[str, Any]],
    trace_items: List[Dict[str, Any]]
) -> Tuple[bool, str]:
    """
    Evaluates evidence sufficiency before LLM invocation.
    Detects unanswerable, out-of-scope, or speculative queries.
    
    Returns:
      (is_sufficient, reason)
    """
    if not selected_chunks or not trace_items:
        return False, "I could not find sufficient evidence for this answer in the selected document."

    # Speculative / Unanswerable forward prediction patterns
    lower_q = query.lower()
    speculative_phrases = [
        "guaranteed", "definitely list", "guarantee listing", 
        "target listing gain", "will this double", "will it definitely",
        "guaranteed premium", "100% safe", "in 2028", "in 2029"
    ]
    for phrase in speculative_phrases:
        if phrase in lower_q:
            return False, "Regulatory guidelines and prospectus disclosures prohibit guaranteed listing price or speculative forward return forecasts."

    # Score threshold check: if no chunk achieved basic keyword or vector match
    best_rrf = max((item["rrf_score"] for item in trace_items), default=0.0)
    if best_rrf < 0.005:
        return False, "I could not find sufficient evidence for this answer in the selected document."

    return True, "Sufficient evidence available."
