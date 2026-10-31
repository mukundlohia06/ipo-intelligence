import hashlib
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.services.db import get_db
from app.services.pdf_processor import extract_text_from_pdf, structure_aware_chunking, process_plain_text
from app.services.embedder import get_embeddings
from app.config import settings

router = APIRouter(prefix="/documents", tags=["Document Ingestion"])

@router.get("/chunks/search", summary="Search indexed document chunks")
async def search_chunks(q: str, ipo_id: Optional[str] = None, limit: int = 10) -> List[Dict[str, Any]]:
    db = get_db()
    query_filter: Dict[str, Any] = {}
    if ipo_id and ipo_id != "all":
        query_filter["ipo_id"] = ipo_id
    
    # Regex fallback or text search
    query_filter["text"] = {"$regex": q, "$options": "i"}
    cursor = db.chunks.find(query_filter).limit(limit)
    
    results = []
    for c in cursor:
        results.append({
            "id": c["_id"],
            "ipo_id": c.get("ipo_id"),
            "source_id": c.get("source_id"),
            "section_title": c.get("section_title"),
            "page_number": c.get("page_number", 1),
            "text": c.get("text"),
            "char_start": c.get("char_start", 0),
            "char_end": c.get("char_end", 0),
        })
    return results

@router.get("", summary="List ingested documents for an IPO")
async def list_documents(ipo_id: str = "ipo_abc_industries") -> List[Dict[str, Any]]:
    db = get_db()
    cursor = db.sources.find({"ipo_id": ipo_id}, {"raw_text": 0}).sort("created_at", -1)
    
    docs = []
    for doc in cursor:
        docs.append({
            "id": doc["_id"],
            "ipo_id": doc.get("ipo_id"),
            "title": doc.get("title"),
            "doc_type": doc.get("doc_type"),
            "pages": doc.get("total_pages", 1),
            "chunks_count": doc.get("chunks_count", 0),
            "status": doc.get("status", "searchable"),
            "origin": doc.get("origin", {})
        })
    return docs

@router.get("/{source_id}", summary="Get detailed source document and sections")
async def get_document_detail(source_id: str) -> Dict[str, Any]:
    db = get_db()
    doc = db.sources.find_one({"_id": source_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {
        "id": doc["_id"],
        "ipo_id": doc.get("ipo_id"),
        "title": doc.get("title"),
        "doc_type": doc.get("doc_type"),
        "pages": doc.get("total_pages", 1),
        "chunks_count": doc.get("chunks_count", 0),
        "status": doc.get("status"),
        "sections": doc.get("sections", []),
        "raw_text": doc.get("raw_text", "")
    }

@router.post("/upload", summary="Upload a document for parsing, chunking, and embedding")
async def upload_document(
    file: UploadFile = File(...),
    ipo_id: str = Form("ipo_abc_industries"),
    doc_type: str = Form("report"),
    title: Optional[str] = Form(None)
) -> Dict[str, Any]:
    db = get_db()
    
    # 1. Read file bytes and validate type
    file_bytes = await file.read()
    filename = file.filename or "uploaded_document"
    doc_title = title or filename.rsplit(".", 1)[0].replace("_", " ").title()

    if not filename.lower().endswith(('.pdf', '.txt', '.md')):
        raise HTTPException(status_code=400, detail="Only PDF, TXT, or MD files supported")

    content_hash = hashlib.sha256(file_bytes).hexdigest()

    # 2. Check for duplicate upload (Idempotency)
    existing = db.sources.find_one({"ipo_id": ipo_id, "content_hash": content_hash})
    if existing:
        return {
            "message": "Document already ingested and searchable",
            "source_id": existing["_id"],
            "title": existing["title"],
            "status": existing.get("status", "searchable"),
            "chunks_count": existing.get("chunks_count", 0)
        }

    source_id = f"src_{hashlib.md5(f'{ipo_id}_{content_hash}'.encode()).hexdigest()[:10]}"

    # 3. Extract and chunk text
    try:
        if filename.lower().endswith('.pdf'):
            pages = extract_text_from_pdf(file_bytes)
            raw_text, chunks, sections = structure_aware_chunking(
                pages=pages,
                company_name="ABC Industries Limited",
                doc_type=doc_type
            )
        else:
            text_str = file_bytes.decode("utf-8", errors="replace")
            raw_text, chunks, sections = process_plain_text(
                text=text_str,
                company_name="ABC Industries Limited",
                title=doc_title,
                doc_type=doc_type
            )

        # 4. Generate embeddings
        texts_for_emb = [c["text_for_embedding"] for c in chunks]
        embeddings = get_embeddings(texts_for_emb)

        # 5. Insert Source document
        source_doc = {
            "_id": source_id,
            "ipo_id": ipo_id,
            "title": doc_title,
            "doc_type": doc_type,
            "origin": {
                "kind": "upload",
                "filename": filename
            },
            "content_hash": content_hash,
            "total_pages": max([c["page_number"] for c in chunks], default=1),
            "chunks_count": len(chunks),
            "raw_text": raw_text,
            "sections": sections,
            "status": "searchable",
            "error": None,
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        db.sources.update_one({"_id": source_id}, {"$set": source_doc}, upsert=True)

        # 6. Bulk insert chunks
        chunk_docs = []
        for i, c in enumerate(chunks):
            chunk_doc = {
                "_id": f"chk_{source_id}_{c['ordinal']:03d}",
                "ipo_id": ipo_id,
                "source_id": source_id,
                "ordinal": c["ordinal"],
                "page_number": c["page_number"],
                "section_title": c["section_title"],
                "text": c["text"],
                "text_for_embedding": c["text_for_embedding"],
                "char_start": c["char_start"],
                "char_end": c["char_end"],
                "token_count": c["token_count"],
                "embedding": embeddings[i],
                "embedding_model": settings.EMBEDDING_MODEL,
                "metadata": {
                    "doc_type": doc_type,
                    "section": c["section_title"],
                    "page_number": c["page_number"]
                },
                "flags": [],
                "created_at": datetime.now()
            }
            chunk_docs.append(chunk_doc)

        if chunk_docs:
            db.chunks.insert_many(chunk_docs)

        # Increment documents_count on ipos
        db.ipos.update_one({"_id": ipo_id}, {"$inc": {"documents_count": 1}})

        return {
            "message": "Document parsed, chunked, embedded, and indexed successfully",
            "source_id": source_id,
            "title": doc_title,
            "status": "searchable",
            "chunks_count": len(chunks)
        }

    except Exception as e:
        db.sources.update_one(
            {"_id": source_id},
            {"$set": {"status": "failed", "error": str(e), "updated_at": datetime.now()}},
            upsert=True
        )
        raise HTTPException(status_code=500, detail=f"Document ingestion failed: {e}")
