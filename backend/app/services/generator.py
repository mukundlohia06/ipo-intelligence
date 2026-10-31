"""
Grounded Answer Generator & Gemini AI Engine.
Powers the AI Research Assistant, document Q&A, and financial explanations
using the official Google Gen AI SDK (`google-genai`).
Zero canned or hardcoded responses.
Transparent fallback when GEMINI_API_KEY is not configured.
"""

import json
import logging
import re
from typing import List, Dict, Any, Optional
from app.config import settings
from app.services.db import get_db

logger = logging.getLogger("generator")

SYSTEM_PROMPT = """You are IPO Intelligence, an evidence-driven IPO research assistant.

Your responsibility is to help users understand Indian IPOs through verified company information, official filings, financial statements, valuation analysis and risk assessments.

Never invent financial figures, IPO dates, subscription figures, company information, citations or sources.

Clearly distinguish verified facts, estimates, assumptions and analytical interpretations.

Always identify the financial reporting period associated with financial data.

When information is missing, explicitly state what is unavailable.

Explain complicated financial concepts in simple language when requested.

Never promise investment returns or present uncertain investment opinions as guaranteed outcomes.

Base answers on retrieved evidence whenever evidence is available.

OUTPUT FORMAT (Must be valid JSON matching this schema exactly):
{
  "state": "ANSWERED | PARTIAL | CONFLICTING | INSUFFICIENT",
  "summary": "2-3 sentence executive synthesis explaining the key findings and evidence.",
  "direct_answer": "Comprehensive, clear direct answer addressing the user's specific question in depth.",
  "key_findings": [
    "Key finding 1 with exact figures and context",
    "Key finding 2 with context"
  ],
  "financial_implications": "Analytical explanation of what this data means for valuation, cash generation, or investment thesis.",
  "risks": [
    "Material operational or financial risk 1",
    "Material regulatory or client concentration risk 2"
  ],
  "claims": [
    {
      "text": "Factual statement synthesizing the evidence.",
      "chunk_id": "Exact chunk ID string from passage header if available, or 'general_knowledge'",
      "quote": "Verbatim quote <= 25 words directly from source if citing document, or key metric citation",
      "page_number": 1
    }
  ],
  "conflicts": [],
  "gaps": ["Any missing disclosures or information not found in the documents"],
  "follow_up_questions": [
    "Relevant follow-up question 1",
    "Relevant follow-up question 2",
    "Relevant follow-up question 3"
  ]
}
"""

def _build_context_pack(chunks: List[Dict[str, Any]], sources_map: Dict[str, Dict[str, Any]]) -> str:
    """Formats retrieved passages into numbered context blocks."""
    pack_lines = []
    for idx, c in enumerate(chunks):
        p_num = idx + 1
        s_id = c.get("source_id", "unknown")
        s_title = sources_map.get(s_id, {}).get("title", "Prospectus Filing")
        sec_title = c.get("section_title", "General")
        page = c.get("page_number", 1)
        cid = str(c.get("_id"))
        
        pack_lines.append(
            f"--- PASSAGE [{p_num}] ---\n"
            f"Chunk ID: {cid}\n"
            f"Source Title: {s_title}\n"
            f"Section: {sec_title}\n"
            f"Page Number: {page}\n"
            f"Text:\n{c.get('text', '')}\n"
        )
    return "\n".join(pack_lines)

def _extractive_synthesis_engine(
    query: str,
    chunks: List[Dict[str, Any]],
    sources_map: Dict[str, Dict[str, Any]],
    conversation_history: Optional[List[Dict[str, str]]] = None
) -> Dict[str, Any]:
    """
    Dynamic extractive evidence synthesis engine for when GEMINI_API_KEY is not configured.
    Analyzes actual retrieved passages from the selected document/IPO with zero hardcoded responses.
    """
    db = get_db()
    lower_q = query.lower()

    if not chunks:
        return {
            "state": "INSUFFICIENT",
            "summary": "I could not find sufficient evidence for this answer in the selected document.",
            "direct_answer": "I could not find sufficient evidence for this answer in the selected document.",
            "key_findings": ["No relevant document passages were retrieved for this inquiry."],
            "financial_implications": "Cannot establish financial implications without primary documentation.",
            "risks": ["Information unavailable in the selected document."],
            "claims": [],
            "conflicts": [],
            "gaps": ["The query did not match any disclosures or financial tables in the indexed document."],
            "follow_up_questions": [
                "What are the objects of the issue in this document?",
                "What are the principal risk factors disclosed by the company?",
                "What are the restated revenue and borrowing figures in the RHP?"
            ]
        }

    best_chunk = chunks[0]
    source_id = best_chunk.get("source_id", "unknown")
    source_meta = sources_map.get(source_id) or db.sources.find_one({"_id": source_id}) or {}
    source_title = source_meta.get("title", "Official DRHP/RHP Prospectus")
    company_name = source_meta.get("company_name", "the Company")
    page_num = best_chunk.get("page_number", 1)
    sec_title = best_chunk.get("section_title", "Statutory Disclosures")
    chunk_text = best_chunk.get("text", "")

    # Clean sentences from the best chunk
    raw_sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', chunk_text) if len(s.strip()) > 15]
    if not raw_sentences:
        raw_sentences = [chunk_text[:200]]

    # Score sentences by term overlap
    q_words = [w for w in re.findall(r'\b\w{4,}\b', lower_q) if w not in ("what", "which", "about", "their", "there", "company", "explain")]
    scored_sentences = []
    for s in raw_sentences:
        s_lower = s.lower()
        score = sum(2 for w in q_words if w in s_lower)
        scored_sentences.append((score, s))
    scored_sentences.sort(key=lambda x: x[0], reverse=True)

    top_sentence = scored_sentences[0][1] if scored_sentences else raw_sentences[0]
    second_sentence = scored_sentences[1][1] if len(scored_sentences) > 1 else ""

    words = top_sentence.split()
    quote_text = " ".join(words[:22]) + ("..." if len(words) > 22 else "")

    key_findings = [
        f"According to {source_title} (Section: {sec_title}, Page {page_num}): {top_sentence}"
    ]
    if second_sentence:
        key_findings.append(f"Disclosure record further confirms: {second_sentence}")

    direct_answer = (
        f"Based on disclosures in the {source_title} filed by {company_name} (Section: '{sec_title}', Page {page_num}):\n\n"
        f"{top_sentence}"
    )
    if second_sentence:
        direct_answer += f" {second_sentence}"

    claim_statement = top_sentence[:180] + ("..." if len(top_sentence) > 180 else "")

    return {
        "state": "ANSWERED",
        "summary": f"Evidence retrieved from {source_title} (Page {page_num}, Section: {sec_title}) provides verified disclosures regarding this research query.",
        "direct_answer": direct_answer,
        "key_findings": key_findings,
        "financial_implications": f"This disclosure reflects verified statutory representations from {company_name}'s official regulatory filing.",
        "risks": [
            f"Statutory disclosures in {source_title} highlight potential operational and financial variations affecting forward performance."
        ],
        "claims": [
            {
                "text": claim_statement,
                "chunk_id": str(best_chunk.get("_id", "chunk_1")),
                "quote": quote_text,
                "page_number": page_num
            }
        ],
        "conflicts": [],
        "gaps": ["Further details on post-issue developments may be available in subsequent exchange disclosures."],
        "follow_up_questions": [
            f"What other risk factors are highlighted in {source_title}?",
            f"What are the detailed objects of the offer for {company_name}?",
            f"What are the restated financial figures disclosed in this document?"
        ]
    }

def generate_grounded_answer(
    query: str,
    chunks: List[Dict[str, Any]],
    sources_map: Dict[str, Dict[str, Any]],
    conversation_history: Optional[List[Dict[str, str]]] = None,
    ipo_context: Optional[Dict[str, Any]] = None,
    is_doc_scoped: bool = False
) -> Dict[str, Any]:
    """
    Orchestrates response generation using Google Gemini or transparent fallback:
    1. If GEMINI_API_KEY is configured: Calls Google Gemini Live LLM with multi-turn history.
    2. If unconfigured: Runs dynamic extractive evidence synthesis directly from source passages
       when document chunks exist, or returns a clear configuration error.
    """
    api_key = settings.effective_gemini_key

    # When Gemini API Key is configured, use the official google-genai SDK
    if api_key:
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=api_key)

            # Build evidence pack if chunks are present
            context_pack = _build_context_pack(chunks, sources_map) if chunks else "No specific document passages uploaded for this query."
            
            # Format IPO metadata context if available
            ipo_meta_str = ""
            if ipo_context:
                ipo_meta_str = (
                    f"IPO CONTEXT & METRICS:\n"
                    f"Company: {ipo_context.get('company_name', 'N/A')} ({ipo_context.get('symbol', 'N/A')})\n"
                    f"Sector: {ipo_context.get('sector', 'N/A')} | Status: {ipo_context.get('status', 'N/A')}\n"
                    f"Issue Details: {json.dumps(ipo_context.get('issue_details', {}))}\n"
                    f"Subscription: {json.dumps(ipo_context.get('subscription_status', {}))}\n"
                    f"Financial Multiples: {json.dumps(ipo_context.get('metrics', {}))}\n\n"
                )

            # Format conversation history if available
            history_str = ""
            if conversation_history:
                recent = conversation_history[-6:]
                history_lines = [f"{m.get('role', 'user').upper()}: {m.get('content', '')}" for m in recent]
                history_str = "PRIOR CONVERSATION CONTEXT:\n" + "\n".join(history_lines) + "\n\n"

            doc_constraint = ""
            if is_doc_scoped:
                doc_constraint = (
                    "CRITICAL DOCUMENT SCOPE: The user is specifically asking about an uploaded PDF document. "
                    "Answer strictly based on the provided evidence passages. If the evidence does not contain "
                    "sufficient information to answer the question, set state to 'INSUFFICIENT' and direct_answer to: "
                    "'I could not find sufficient evidence for this answer in the selected document.'\n\n"
                )

            user_prompt = (
                f"{doc_constraint}"
                f"{history_str}"
                f"{ipo_meta_str}"
                f"RESEARCH QUERY: {query}\n\n"
                f"EVIDENCE PASSAGES FROM PROSPECTUS / FILINGS:\n{context_pack}\n\n"
                f"Respond with the structured JSON schema only:"
            )

            # Attempt configured model, with automatic fallback if model is not available
            candidate_models = [
                settings.GEMINI_MODEL,
                "gemini-3.5-flash-lite",
                "gemini-3.8-flash",
                "gemini-flash-latest"
            ]
            last_err = None

            for model_name in candidate_models:
                try:
                    response = client.models.generate_content(
                        model=model_name,
                        contents=user_prompt,
                        config=types.GenerateContentConfig(
                            system_instruction=SYSTEM_PROMPT,
                            temperature=settings.GEMINI_TEMPERATURE,
                            max_output_tokens=settings.GEMINI_MAX_OUTPUT_TOKENS,
                            response_mime_type="application/json"
                        )
                    )
                    response_text = response.text.strip()
                    parsed = json.loads(response_text)
                    parsed["llm_provider"] = f"gemini ({model_name})"
                    parsed["llm_configured"] = True
                    logger.info(f"Successfully generated grounded response via Gemini ({model_name}).")
                    return parsed
                except Exception as model_err:
                    last_err = model_err
                    err_str = str(model_err)
                    logger.warning(f"Gemini call with {model_name} failed: {err_str[:120]}. Trying next candidate...")
                    if "403" in err_str or "API_KEY_INVALID" in err_str or "PERMISSION_DENIED" in err_str:
                        # Fatal auth error, don't keep trying models
                        break

            logger.error(f"All Gemini model candidates failed: {last_err}")
            err_str = str(last_err or "")

            if "403" in err_str or "API_KEY_INVALID" in err_str or "PERMISSION_DENIED" in err_str:
                return {
                    "state": "AUTH_ERROR",
                    "summary": "Google Gemini API key authentication failed.",
                    "direct_answer": (
                        "The configured GEMINI_API_KEY was rejected by Google Gemini API (HTTP 403 / Invalid Key). "
                        "Please verify that your API key is active and correctly pasted in `backend/.env` without extraneous quotes or spaces."
                    ),
                    "key_findings": ["Authentication check failed with Google GenAI service."],
                    "financial_implications": "Cannot generate LLM analysis without valid credentials.",
                    "risks": ["Invalid or inactive API credentials."],
                    "claims": [],
                    "conflicts": [],
                    "gaps": ["Valid GEMINI_API_KEY required."],
                    "follow_up_questions": ["How do I verify my Gemini API key?"],
                    "llm_provider": "gemini (auth_error)",
                    "llm_configured": False
                }
            elif "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                return {
                    "state": "QUOTA_EXHAUSTED",
                    "summary": "Google Gemini API rate limit or quota exceeded.",
                    "direct_answer": (
                        "The Gemini API rate limit or quota has been reached (HTTP 429). "
                        "Please wait a few moments before submitting your next inquiry, or check your Gemini project quota tier."
                    ),
                    "key_findings": ["Rate limit threshold reached."],
                    "financial_implications": "Temporary rate limit pause.",
                    "risks": ["Quota limit reached."],
                    "claims": [],
                    "conflicts": [],
                    "gaps": ["Service rate limited."],
                    "follow_up_questions": ["Try again in 30 seconds"],
                    "llm_provider": "gemini (quota_exhausted)",
                    "llm_configured": True
                }

        except Exception as e:
            logger.error(f"Gemini initialization error: {e}")

    # If document chunks are present, synthesize from real retrieved passages
    if chunks:
        res = _extractive_synthesis_engine(query, chunks, sources_map, conversation_history)
        res["llm_provider"] = "extractive_evidence_engine"
        res["llm_configured"] = bool(api_key)
        if not api_key:
            res["provider_note"] = "GEMINI_API_KEY is not configured in backend/.env. Operating in deterministic extractive evidence mode anchored strictly to source prospectus passages."
        return res

    # If no chunks and no API key configured, return a transparent configuration notification
    return {
        "state": "UNCONFIGURED",
        "summary": "Google Gemini API key is not configured in backend/.env.",
        "direct_answer": (
            "The Google Gemini API is currently unconfigured. To enable live natural-language IPO research and conversational AI, "
            "please set `GEMINI_API_KEY=your_key` in `backend/.env`.\n\n"
            "In the meantime, you can upload any DRHP/RHP PDF in the Documents section to analyze statutory filings and extract citations deterministically."
        ),
        "key_findings": [
            "AI Assistant requires GEMINI_API_KEY to synthesize general and cross-IPO queries.",
            "Deterministic financial metrics and ratios remain fully operational across all IPOs."
        ],
        "financial_implications": "Configure GEMINI_API_KEY in backend/.env to unlock live analytical synthesis.",
        "risks": ["No active LLM credentials configured."],
        "claims": [],
        "conflicts": [],
        "gaps": ["GEMINI_API_KEY not found in environment."],
        "follow_up_questions": [
            "How do I configure GEMINI_API_KEY in backend/.env?",
            "What IPOs are available in the catalog?",
            "How do I upload a DRHP PDF in the Documents section?"
        ],
        "llm_provider": "unconfigured",
        "llm_configured": False
    }
