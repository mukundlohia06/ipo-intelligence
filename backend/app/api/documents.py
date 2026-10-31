from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import List, Dict, Any, Optional

router = APIRouter(prefix="/documents", tags=["Document Ingestion"])

@router.get("", summary="List ingested documents for an IPO")
async def list_documents(ipo_id: Optional[str] = None) -> List[Dict[str, Any]]:
    return [
        {
            "id": "src_drhp_abc",
            "ipo_id": "ipo_abc_industries",
            "title": "Draft Red Herring Prospectus (DRHP)",
            "doc_type": "drhp",
            "pages": 412,
            "chunks_count": 840,
            "status": "searchable"
        },
        {
            "id": "src_fin_abc",
            "ipo_id": "ipo_abc_industries",
            "title": "Restated Financial Statements FY21-FY24",
            "doc_type": "financials",
            "pages": 48,
            "chunks_count": 120,
            "status": "searchable"
        },
        {
            "id": "src_broker_icici",
            "ipo_id": "ipo_abc_industries",
            "title": "Institutional Brokerage Research Report",
            "doc_type": "report",
            "pages": 12,
            "chunks_count": 32,
            "status": "searchable"
        }
    ]

@router.post("/upload", summary="Upload a document for parsing and embedding")
async def upload_document(
    file: UploadFile = File(...),
    ipo_id: str = Form("ipo_abc_industries"),
    doc_type: str = Form("report")
) -> Dict[str, Any]:
    # Milestone 1 validation
    if not file.filename.lower().endswith(('.pdf', '.txt', '.md')):
        raise HTTPException(status_code=400, detail="Only PDF, TXT, or MD files supported")
    
    return {
        "message": "File received and queued for ingestion",
        "filename": file.filename,
        "ipo_id": ipo_id,
        "doc_type": doc_type,
        "status": "queued"
    }
