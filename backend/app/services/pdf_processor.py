import fitz  # PyMuPDF
import re
import hashlib
from typing import List, Dict, Any, Tuple

KNOWN_DRHP_SECTIONS = [
    "Summary of the Offer",
    "Objects of the Offer",
    "Risk Factors",
    "Our Business",
    "Industry Overview",
    "Restated Summary Statement of Profit and Loss",
    "Restated Summary Statement of Assets and Liabilities",
    "Restated Summary Statement of Cash Flows",
    "Outstanding Litigation and Material Developments",
    "Financial Information of the Company",
    "Management's Discussion and Analysis",
    "Capital Structure",
    "Basis for Issue Price"
]

def extract_text_from_pdf(pdf_bytes: bytes) -> List[Dict[str, Any]]:
    """
    Extracts text per page with section header detection using PyMuPDF.
    Returns list of {page_number: int, text: str, detected_section: str}
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    pages = []
    current_section = "General Information"

    for page_idx in range(len(doc)):
        page = doc[page_idx]
        page_num = page_idx + 1
        page_text = page.get_text("text")

        # Scan for known section headers in the page text
        for section in KNOWN_DRHP_SECTIONS:
            pattern = re.compile(re.escape(section), re.IGNORECASE)
            if pattern.search(page_text):
                current_section = section
                break

        pages.append({
            "page_number": page_num,
            "text": page_text,
            "section": current_section
        })

    doc.close()
    return pages

def structure_aware_chunking(
    pages: List[Dict[str, Any]],
    company_name: str,
    doc_type: str = "drhp",
    target_chunk_size: int = 750,
    overlap_chars: int = 100
) -> Tuple[str, List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Takes extracted pages, normalizes text, creates contiguous raw_text,
    and slices into structure-aware chunks with exact offsets and page references.
    
    Returns:
      (raw_text, chunks, sections_list)
    """
    raw_text_parts = []
    page_offsets = [] # (page_num, start_offset, end_offset, section)
    sections_seen = {}

    current_offset = 0
    for p in pages:
        p_text = p["text"]
        # Normalize excessive whitespace but preserve paragraph breaks
        cleaned_page = re.sub(r'[ \t]+', ' ', p_text)
        cleaned_page = re.sub(r'\n{3,}', '\n\n', cleaned_page).strip()
        
        if not cleaned_page:
            continue

        start = current_offset
        end = start + len(cleaned_page)
        page_offsets.append({
            "page_number": p["page_number"],
            "start": start,
            "end": end,
            "section": p["section"]
        })
        
        if p["section"] not in sections_seen:
            sections_seen[p["section"]] = {
                "id": f"sec_{len(sections_seen) + 1}",
                "title": p["section"],
                "page_number": p["page_number"],
                "char_start": start,
                "char_end": end
            }
        else:
            sections_seen[p["section"]]["char_end"] = end

        raw_text_parts.append(cleaned_page)
        current_offset = end + 2 # account for double newline between pages

    full_raw_text = "\n\n".join(raw_text_parts)
    chunks = []
    ordinal = 0

    # Chunk page by page or across paragraph boundaries
    for po in page_offsets:
        page_text = full_raw_text[po["start"]:po["end"]]
        paragraphs = [p.strip() for p in page_text.split("\n\n") if p.strip()]

        current_chunk_text = ""
        chunk_start_in_page = 0

        for para in paragraphs:
            if len(current_chunk_text) + len(para) < target_chunk_size:
                current_chunk_text += ("\n\n" + para if current_chunk_text else para)
            else:
                if current_chunk_text:
                    c_start = po["start"] + chunk_start_in_page
                    c_end = c_start + len(current_chunk_text)
                    
                    context_prefix = f"{company_name} › {po['section']} (Page {po['page_number']}) › "
                    chunks.append({
                        "ordinal": ordinal,
                        "page_number": po["page_number"],
                        "section_title": po["section"],
                        "text": current_chunk_text,
                        "text_for_embedding": context_prefix + current_chunk_text,
                        "char_start": c_start,
                        "char_end": c_end,
                        "token_count": len(current_chunk_text.split()),
                        "metadata": {
                            "doc_type": doc_type,
                            "page_number": po["page_number"],
                            "section": po["section"]
                        }
                    })
                    ordinal += 1
                    
                    # Apply overlap
                    overlap_text = current_chunk_text[-overlap_chars:] if len(current_chunk_text) > overlap_chars else ""
                    current_chunk_text = (overlap_text + "\n" + para) if overlap_text else para
                    chunk_start_in_page = max(0, page_text.find(para, chunk_start_in_page))
                else:
                    current_chunk_text = para

        if current_chunk_text:
            c_start = po["start"] + chunk_start_in_page
            c_end = c_start + len(current_chunk_text)
            context_prefix = f"{company_name} › {po['section']} (Page {po['page_number']}) › "
            chunks.append({
                "ordinal": ordinal,
                "page_number": po["page_number"],
                "section_title": po["section"],
                "text": current_chunk_text,
                "text_for_embedding": context_prefix + current_chunk_text,
                "char_start": c_start,
                "char_end": c_end,
                "token_count": len(current_chunk_text.split()),
                "metadata": {
                    "doc_type": doc_type,
                    "page_number": po["page_number"],
                    "section": po["section"]
                }
            })
            ordinal += 1

    return full_raw_text, chunks, list(sections_seen.values())

def process_plain_text(
    text: str,
    company_name: str,
    title: str,
    doc_type: str = "report"
) -> Tuple[str, List[Dict[str, Any]], List[Dict[str, Any]]]:
    """Helper for plain text / markdown files."""
    pages = [{"page_number": 1, "text": text, "section": title}]
    return structure_aware_chunking(pages, company_name=company_name, doc_type=doc_type)
