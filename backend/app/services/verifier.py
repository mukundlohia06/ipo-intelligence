import re
from typing import List, Dict, Any, Tuple

def normalize_for_matching(text: str) -> str:
    """Normalizes whitespace, casing, and punctuation for robust quote substring matching."""
    if not text:
        return ""
    # Replace curly quotes and typographic dashes
    t = text.replace("“", '"').replace("”", '"').replace("‘", "'").replace("’", "'")
    t = t.replace("–", "-").replace("—", "-")
    # Collapse whitespace and lowercase
    t = re.sub(r'\s+', ' ', t).strip().lower()
    return t

def verify_claims(
    claims: List[Dict[str, Any]],
    chunks_map: Dict[str, Dict[str, Any]],
    sources_map: Dict[str, Dict[str, Any]]
) -> Tuple[List[Dict[str, Any]], List[str], float]:
    """
    Programmatically verifies that every claim's quote exists verbatim inside the cited chunk.
    
    Returns:
      (verified_claims, gaps, verification_rate)
    """
    if not claims:
        return [], ["No specific factual claims were produced to verify."], 1.0

    verified_claims = []
    gaps = []
    verified_count = 0

    for claim in claims:
        chunk_id = claim.get("chunk_id")
        quote = claim.get("quote", "").strip()

        chunk_doc = chunks_map.get(chunk_id)
        if not chunk_doc or not quote:
            gaps.append(f"Claim unsupported: referenced chunk or quotation missing: '{claim.get('text')}'")
            continue

        chunk_text = chunk_doc.get("text", "")
        norm_quote = normalize_for_matching(quote)
        norm_chunk = normalize_for_matching(chunk_text)

        # Check verbatim substring match
        if norm_quote and norm_quote in norm_chunk:
            # Find char offset in raw chunk text
            # Find approximate case-insensitive location in original text
            match = re.search(re.escape(quote[:20]), chunk_text, re.IGNORECASE) if len(quote) >= 20 else re.search(re.escape(quote), chunk_text, re.IGNORECASE)
            q_start = match.start() if match else 0
            q_end = q_start + len(quote)

            claim["verified"] = True
            claim["quote_start"] = q_start
            claim["quote_end"] = q_end
            claim["page_number"] = chunk_doc.get("page_number", 1)
            
            # Enrich with source title
            source_id = chunk_doc.get("source_id")
            source_doc = sources_map.get(source_id, {})
            claim["source_title"] = source_doc.get("title", "Prospectus Document")

            verified_claims.append(claim)
            verified_count += 1
        else:
            # Drop unverified claim to prevent hallucination propagation
            gaps.append(f"Citation verification failed: quote '{quote[:40]}...' was not found verbatim in chunk '{chunk_id}'. Claim dropped.")

    verification_rate = round(verified_count / len(claims), 3) if claims else 1.0
    return verified_claims, gaps, verification_rate
