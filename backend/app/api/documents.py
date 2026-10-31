import hashlib
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query
from app.services.db import get_db
from app.services.pdf_processor import extract_text_from_pdf, structure_aware_chunking, process_plain_text
from app.services.embedder import get_embeddings
from app.config import settings

router = APIRouter(prefix="/documents", tags=["Document Ingestion"])

MAX_UPLOAD_SIZE = 50 * 1024 * 1024  # 50 MB limit

@router.get("/chunks/search", summary="Search indexed document chunks")
async def search_chunks(
    q: str = Query(..., min_length=1),
    ipo_id: Optional[str] = None,
    doc_id: Optional[str] = None,
    limit: int = 15
) -> List[Dict[str, Any]]:
    db = get_db()
    query_filter: Dict[str, Any] = {}
    if ipo_id and ipo_id != "all":
        query_filter["ipo_id"] = ipo_id
    if doc_id:
        query_filter["source_id"] = doc_id
    
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

@router.get("", summary="List ingested documents for an IPO or globally")
async def list_documents(ipo_id: Optional[str] = Query(None)) -> List[Dict[str, Any]]:
    db = get_db()
    query_filter: Dict[str, Any] = {}
    if ipo_id and ipo_id.lower() not in ("all", ""):
        query_filter["ipo_id"] = ipo_id
    
    cursor = db.sources.find(query_filter, {"raw_text": 0}).sort("created_at", -1)
    
    docs = []
    for doc in cursor:
        docs.append({
            "id": doc["_id"],
            "ipo_id": doc.get("ipo_id"),
            "title": doc.get("title"),
            "doc_type": doc.get("doc_type", "report"),
            "filename": doc.get("origin", {}).get("filename") or doc.get("title"),
            "pages": doc.get("total_pages", 1),
            "chunks_count": doc.get("chunks_count", 0),
            "status": doc.get("status", "ready"),
            "is_user_uploaded": doc.get("is_user_uploaded", False),
            "origin": doc.get("origin", {}),
            "created_at": doc.get("created_at", datetime.now()).isoformat() if isinstance(doc.get("created_at"), datetime) else doc.get("created_at")
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
        "status": doc.get("status", "ready"),
        "sections": doc.get("sections", []),
        "raw_text": doc.get("raw_text", "")
    }

@router.delete("/{source_id}", summary="Delete an ingested document and its indexed chunks")
async def delete_document(source_id: str) -> Dict[str, Any]:
    db = get_db()
    doc = db.sources.find_one({"_id": source_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    ipo_id = doc.get("ipo_id")
    # Delete chunks
    chunk_res = db.chunks.delete_many({"source_id": source_id})
    # Delete source
    db.sources.delete_one({"_id": source_id})
    
    # Decrement document count on IPO if applicable
    if ipo_id:
        db.ipos.update_one({"_id": ipo_id}, {"$inc": {"documents_count": -1}})

    return {
        "status": "deleted",
        "source_id": source_id,
        "title": doc.get("title"),
        "deleted_chunks": chunk_res.deleted_count
    }

@router.post("/upload", summary="Upload a document for parsing, chunking, and embedding")
async def upload_document(
    file: UploadFile = File(...),
    ipo_id: str = Form("ipo_hyundai_motor_india"),
    doc_type: str = Form("prospectus"),
    title: Optional[str] = Form(None)
) -> Dict[str, Any]:
    db = get_db()
    
    # 1. Read file bytes and validate size & extension
    file_bytes = await file.read()
    if len(file_bytes) > MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds maximum allowed size of 50 MB (size: {len(file_bytes) / 1024 / 1024:.2f} MB)."
        )

    filename = file.filename or "uploaded_document"
    doc_title = title or filename.rsplit(".", 1)[0].replace("_", " ").title()

    if not filename.lower().endswith(('.pdf', '.txt', '.md')):
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload a PDF, TXT, or MD document.")

    content_hash = hashlib.sha256(file_bytes).hexdigest()
    source_id = f"src_{hashlib.md5(f'{ipo_id}_{content_hash}'.encode()).hexdigest()[:10]}"

    # 2. Check for duplicate upload (Idempotency)
    existing = db.sources.find_one({"_id": source_id}) or db.sources.find_one({"content_hash": content_hash})
    if existing:
        return {
            "message": "Document already ingested and ready for AI research.",
            "source_id": existing["_id"],
            "title": existing["title"],
            "status": existing.get("status", "ready"),
            "pages": existing.get("total_pages", 1),
            "chunks_count": existing.get("chunks_count", 0),
            "chunks_created": existing.get("chunks_count", 0)
        }

    # 3. Resolve Company Name for context prefixing
    ipo_record = db.ipos.find_one({"_id": ipo_id})
    company_name = ipo_record.get("company_name") if ipo_record else doc_title

    # 4. Extract and chunk text
    try:
        if filename.lower().endswith('.pdf'):
            pages, total_pages, total_chars = extract_text_from_pdf(file_bytes)
            raw_text, chunks, sections = structure_aware_chunking(
                pages=pages,
                company_name=company_name,
                doc_type=doc_type
            )
        else:
            text_str = file_bytes.decode("utf-8", errors="replace")
            total_pages = 1
            total_chars = len(text_str)
            raw_text, chunks, sections = process_plain_text(
                text=text_str,
                company_name=company_name,
                title=doc_title,
                doc_type=doc_type
            )

        if not chunks:
            raise ValueError("Document yielded 0 text chunks after processing.")

        # 5. Generate embeddings
        texts_for_emb = [c["text_for_embedding"] for c in chunks]
        embeddings = get_embeddings(texts_for_emb)

        # 6. Insert Source document
        source_doc = {
            "_id": source_id,
            "ipo_id": ipo_id,
            "title": doc_title,
            "doc_type": doc_type,
            "origin": {
                "kind": "user_upload",
                "filename": filename
            },
            "content_hash": content_hash,
            "total_pages": total_pages,
            "total_characters": total_chars,
            "chunks_count": len(chunks),
            "raw_text": raw_text[:200000],  # cap stored raw text for DB efficiency
            "sections": sections,
            "status": "ready",
            "is_user_uploaded": True,
            "error": None,
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        db.sources.update_one({"_id": source_id}, {"$set": source_doc}, upsert=True)

        # 7. Bulk insert chunks
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
                    "page_number": c["page_number"],
                    "filename": filename
                },
                "flags": [],
                "created_at": datetime.now()
            }
            chunk_docs.append(chunk_doc)

        if chunk_docs:
            for chk in chunk_docs:
                db.chunks.update_one({"_id": chk["_id"]}, {"$set": chk}, upsert=True)

        # Increment documents_count on ipo record
        if ipo_record:
            db.ipos.update_one({"_id": ipo_id}, {"$inc": {"documents_count": 1}})

        return {
            "message": "Document parsed, chunked, and indexed successfully into MongoDB Atlas.",
            "source_id": source_id,
            "title": doc_title,
            "status": "ready",
            "pages": total_pages,
            "chunks_count": len(chunks),
            "chunks_created": len(chunks)
        }

    except ValueError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        db.sources.update_one(
            {"_id": source_id},
            {"$set": {"status": "failed", "error": str(e), "updated_at": datetime.now()}},
            upsert=True
        )
        raise HTTPException(status_code=500, detail=f"Document ingestion failed: {e}")
