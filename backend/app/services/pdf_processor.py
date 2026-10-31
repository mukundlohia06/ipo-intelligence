"""
Structure-Aware PDF & Document Processor for IPO Intelligence.
Leverages PyMuPDF (fitz) for high-accuracy text extraction, section boundary detection,
scanned document detection, and token-aware sliding window chunking with page retention.
"""

import fitz  # PyMuPDF
import re
import hashlib
from typing import List, Dict, Any, Tuple

# Comprehensive list of standard statutory DRHP/RHP and financial report sections
KNOWN_STATUTORY_SECTIONS = [
    "Summary of the Offer",
    "Objects of the Offer",
    "Objects of the Fresh Issue",
    "Use of Proceeds",
    "Risk Factors",
    "Our Business",
    "Industry Overview",
    "Restated Summary Statement of Profit and Loss",
    "Restated Summary Statement of Assets and Liabilities",
    "Restated Summary Statement of Cash Flows",
    "Outstanding Litigation and Material Developments",
    "Litigation Involving Our Company",
    "Financial Information of the Company",
    "Management's Discussion and Analysis",
    "Capital Structure",
    "Basis for Issue Price",
    "Related Party Transactions",
    "Promoter and Promoter Group",
    "Corporate Governance",
    "Dividend Policy"
]

def extract_text_from_pdf(pdf_bytes: bytes) -> Tuple[List[Dict[str, Any]], int, int]:
    """
    Extracts text per page with section header detection using PyMuPDF.
    Validates PDF integrity and detects scanned documents lacking extractable text.
    
    Returns:
      (pages_list, total_pages, total_characters)
    
    Raises:
      ValueError: If file is not a valid PDF or is a scanned document without OCR.
    """
    if not pdf_bytes.startswith(b"%PDF"):
        raise ValueError("Invalid file format: Document does not contain a valid %PDF header.")

    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    except Exception as e:
        raise ValueError(f"Failed to open PDF document: {str(e)}")

    total_pages = len(doc)
    if total_pages == 0:
        doc.close()
        raise ValueError("Uploaded PDF document contains 0 pages.")

    pages = []
    current_section = "General Information"
    total_characters = 0

    for page_idx in range(total_pages):
        page = doc[page_idx]
        page_num = page_idx + 1
        page_text = page.get_text("text")
        
        char_count = len(page_text.strip())
        total_characters += char_count

        # Check for section headers in page text
        lines = page_text.splitlines()
        for line in lines[:8]:  # check top lines of page for header
            clean_line = line.strip()
            for sec in KNOWN_STATUTORY_SECTIONS:
                if sec.lower() in clean_line.lower() and len(clean_line) < 100:
                    current_section = sec
                    break

        pages.append({
            "page_number": page_num,
            "text": page_text,
            "section": current_section,
            "char_count": char_count
        })

    doc.close()

    # Scanned PDF Detection:
    # If the document has pages but virtually no extractable text characters (< 50 chars total or avg < 15 chars/page)
    if total_characters < 50 or (total_pages > 1 and total_characters / total_pages < 15):
        raise ValueError(
            f"This uploaded PDF ({total_pages} pages) appears to be a scanned document with no extractable text layer "
            f"({total_characters} characters extracted). Please upload a searchable digital PDF or run OCR before uploading."
        )

    return pages, total_pages, total_characters

def structure_aware_chunking(
    pages: List[Dict[str, Any]],
    company_name: str,
    doc_type: str = "prospectus",
    target_chunk_size: int = 700,
    overlap_chars: int = 120
) -> Tuple[str, List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Takes extracted pages, normalizes text, creates contiguous raw_text,
    and slices into structure-aware chunks with exact character offsets and page references.
    
    Returns:
      (raw_text, chunks, sections_list)
    """
    raw_text_parts = []
    page_offsets = []
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
        current_offset = end + 2

    full_raw_text = "\n\n".join(raw_text_parts)
    chunks = []
    ordinal = 0

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
    pages = [{"page_number": 1, "text": text, "section": title, "char_count": len(text)}]
    return structure_aware_chunking(pages, company_name=company_name, doc_type=doc_type)
