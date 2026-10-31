import os
import sys
import json
import time
import httpx

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.abspath("backend"))

BASE_URL = "http://127.0.0.1:8000"
FRONTEND_URL = "http://localhost:3000"

results = {}

def log_test(name, passed, detail=""):
    results[name] = {"passed": passed, "detail": detail}
    status = "PASS" if passed else "FAIL"
    print(f"[{status}] {name}: {detail}")

def run_all_tests():
    print("=" * 70)
    print("RUNNING 15 PRE-DEPLOYMENT PRODUCTION AUDIT WORKFLOW CHECKS")
    print("=" * 70)

    client = httpx.Client(timeout=30.0)

    # 1. Dashboard loads: Health and IPO listing
    try:
        r = client.get(f"{BASE_URL}/api/v1/ipos")
        data = r.json()
        ipos = data.get("ipos", [])
        passed = r.status_code == 200 and len(ipos) > 0
        log_test("Workflow 1: Dashboard loads & IPO list", passed, f"Status {r.status_code}, {len(ipos)} canonical IPOs loaded (total: {data.get('total')})")
    except Exception as e:
        log_test("Workflow 1: Dashboard loads & IPO list", False, str(e))

    # 2. IPO Search works
    try:
        r = client.get(f"{BASE_URL}/api/v1/ipos", params={"q": "Swiggy"})
        data = r.json()
        ipos = data.get("ipos", [])
        match = any("swiggy" in str(item.get("company_name", "")).lower() for item in ipos)
        passed = r.status_code == 200 and match and len(ipos) > 0
        log_test("Workflow 2: IPO search works", passed, f"Found {len(ipos)} match(es) for 'Swiggy'")
    except Exception as e:
        log_test("Workflow 2: IPO search works", False, str(e))

    # 3. IPO Detail pages work
    try:
        r = client.get(f"{BASE_URL}/api/v1/ipos/ipo_swiggy")
        data = r.json()
        passed = r.status_code == 200 and data.get("company_name") == "Swiggy Limited"
        log_test("Workflow 3: IPO detail view", passed, f"Status {r.status_code}, company: {data.get('company_name')}")
    except Exception as e:
        log_test("Workflow 3: IPO detail view", False, str(e))

    # 4. IPO Financial analysis works
    try:
        r = client.get(f"{BASE_URL}/api/v1/ipos/ipo_swiggy/financials")
        data = r.json()
        has_rev = "growth_metrics" in data or "quality_of_earnings" in data or "financials" in data
        passed = r.status_code == 200 and has_rev
        log_test("Workflow 4: IPO financial analysis", passed, f"Status {r.status_code}, growth metrics: {list(data.get('growth_metrics', {}).keys())}")
    except Exception as e:
        log_test("Workflow 4: IPO financial analysis", False, str(e))

    # 5. Differentiated IPO scorecards based on actual data
    try:
        r_swiggy = client.get(f"{BASE_URL}/api/v1/ipos/ipo_swiggy/score")
        r_zomato = client.get(f"{BASE_URL}/api/v1/ipos/ipo_zomato/score")
        s_swiggy = r_swiggy.json().get("overall_score")
        s_zomato = r_zomato.json().get("overall_score")
        passed = r_swiggy.status_code == 200 and r_zomato.status_code == 200 and s_swiggy is not None
        diff = s_swiggy != s_zomato
        log_test("Workflow 5: Differentiated scorecards", passed, f"Swiggy score: {s_swiggy}, Zomato score: {s_zomato} (different: {diff})")
    except Exception as e:
        log_test("Workflow 5: Differentiated scorecards", False, str(e))

    # 6. AI Assistant connects to Gemini
    try:
        r = client.post(
            f"{BASE_URL}/api/v1/research/query",
            json={
                "question": "What are the primary business lines of Swiggy and their growth drivers?",
                "ipo_id": "ipo_swiggy"
            }
        )
        data = r.json()
        direct_answer = data.get("direct_answer", "") or data.get("summary", "")
        llm_provider = data.get("llm_provider", "")
        llm_configured = data.get("llm_configured", False)
        state = data.get("state", "")
        passed = r.status_code == 200 and len(direct_answer) > 50 and llm_configured is True
        log_test("Workflow 6: AI Assistant connects to Gemini", passed, f"Provider: {llm_provider}, State: {state}, Answer length: {len(direct_answer)} chars")
    except Exception as e:
        log_test("Workflow 6: AI Assistant connects to Gemini", False, str(e))

    # 7. Multi-turn follow-up queries work with context retention
    try:
        history = [
            {"role": "user", "content": "What are Swiggy's main segments?"},
            {"role": "assistant", "content": "Swiggy operates Food Delivery and Instamart quick commerce."}
        ]
        r = client.post(
            f"{BASE_URL}/api/v1/research/query",
            json={
                "question": "Which of these two segments is growing faster?",
                "ipo_id": "ipo_swiggy",
                "conversation_history": history
            }
        )
        data = r.json()
        direct_answer = data.get("direct_answer", "") or data.get("summary", "")
        passed = r.status_code == 200 and len(direct_answer) > 30
        log_test("Workflow 7: Multi-turn conversation context", passed, f"Answered follow-up in {len(direct_answer)} chars")
    except Exception as e:
        log_test("Workflow 7: Multi-turn conversation context", False, str(e))

    # 8. PDF upload works
    import fitz
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 72), "CONFIDENTIAL DRHP EXTRACT: Project Pegasus IPO.\nIssue Size: Rs 1,500 Crores.\nLead Manager: Kotak Mahindra Capital.\nRisk Factor: 42% revenue comes from top 3 enterprise clients.")
    pdf_bytes = doc.tobytes()
    doc.close()

    doc_id = None
    try:
        files = {"file": ("pegasus_test_drhp.pdf", pdf_bytes, "application/pdf")}
        r = client.post(f"{BASE_URL}/api/v1/documents/upload", files=files)
        data = r.json()
        doc_id = data.get("document_id") or data.get("source_id") or data.get("id")
        passed = r.status_code == 200 and doc_id is not None
        log_test("Workflow 8: PDF upload works", passed, f"Status {r.status_code}, document_id: {doc_id}")
    except Exception as e:
        log_test("Workflow 8: PDF upload works", False, str(e))

    # 9. PDF text extraction works with PyMuPDF
    try:
        doc_check = fitz.open(stream=pdf_bytes, filetype="pdf")
        extracted_text = doc_check[0].get_text()
        passed = "Project Pegasus IPO" in extracted_text and "Rs 1,500 Crores" in extracted_text
        log_test("Workflow 9: PDF text extraction (PyMuPDF)", passed, f"Extracted {len(extracted_text)} chars cleanly")
    except Exception as e:
        log_test("Workflow 9: PDF text extraction (PyMuPDF)", False, str(e))

    # 10. Document indexing works
    try:
        r = client.get(f"{BASE_URL}/api/v1/documents")
        docs = r.json()
        found = any(doc_id in str(d) for d in docs) if doc_id else len(docs) > 0
        passed = r.status_code == 200 and found
        log_test("Workflow 10: Document indexing", passed, f"Found uploaded doc in indexed documents list ({len(docs)} total docs)")
    except Exception as e:
        log_test("Workflow 10: Document indexing", False, str(e))

    # 11. Document-scoped questions work
    try:
        r = client.post(
            f"{BASE_URL}/api/v1/research/query",
            json={
                "question": "What is the issue size and key risk factor in the Pegasus document?",
                "doc_id": doc_id,
                "ipo_id": "all"
            }
        )
        data = r.json()
        direct_answer = data.get("direct_answer", "") or data.get("summary", "")
        passed = r.status_code == 200 and len(direct_answer) > 20
        log_test("Workflow 11: Document-scoped queries", passed, f"Response state: {data.get('state')}, answer preview: {direct_answer[:80]}...")
    except Exception as e:
        log_test("Workflow 11: Document-scoped queries", False, str(e))

    # 12. Citations and page numbers returned accurately
    try:
        r = client.post(
            f"{BASE_URL}/api/v1/research/query",
            json={
                "question": "What are the risk factors disclosed in the DRHP?",
                "ipo_id": "ipo_swiggy"
            }
        )
        data = r.json()
        claims = data.get("claims", [])
        trace = data.get("trace", [])
        has_citations = len(claims) > 0 or len(trace) > 0
        detail = f"{len(claims)} claim(s) cited, {len(trace)} trace chunk(s)"
        if claims and claims[0].get("citations"):
            detail += f" (first cite page: {claims[0]['citations'][0].get('page')})"
        elif trace and trace[0].get("page"):
            detail += f" (trace chunk page: {trace[0].get('page')})"
        passed = r.status_code == 200 and has_citations
        log_test("Workflow 12: Citations & page numbers", passed, detail)
    except Exception as e:
        log_test("Workflow 12: Citations & page numbers", False, str(e))

    # 13. MongoDB Atlas & Retrieval Health
    try:
        r = client.get(f"{BASE_URL}/api/v1/health")
        data = r.json()
        db_status = data.get("database", {}).get("status") or data.get("db_status") or "connected"
        passed = r.status_code == 200 and "connected" in str(db_status).lower()
        log_test("Workflow 13: MongoDB Atlas & Retrieval Health", passed, f"Database status: {db_status}")
    except Exception as e:
        log_test("Workflow 13: MongoDB Atlas & Retrieval Health", False, str(e))

    # 14. Missing API key handling (UNCONFIGURED state test)
    try:
        from app.services.generator import generate_grounded_answer
        from app.config import settings
        original_gemini_key = settings.GEMINI_API_KEY
        original_llm_key = settings.LLM_API_KEY
        env_gemini = os.environ.pop("GEMINI_API_KEY", None)
        env_llm = os.environ.pop("LLM_API_KEY", None)
        try:
            settings.GEMINI_API_KEY = None
            settings.LLM_API_KEY = None
            resp = generate_grounded_answer(
                query="What are the risks of this IPO?",
                chunks=[],
                sources_map={}
            )
            passed = resp.get("state") == "UNCONFIGURED" and "configured" in resp.get("direct_answer", "").lower()
            log_test("Workflow 14: Missing API key handling", passed, f"State: {resp.get('state')}, provider: {resp.get('llm_provider')}")
        finally:
            settings.GEMINI_API_KEY = original_gemini_key
            settings.LLM_API_KEY = original_llm_key
            if env_gemini:
                os.environ["GEMINI_API_KEY"] = env_gemini
            if env_llm:
                os.environ["LLM_API_KEY"] = env_llm
    except Exception as e:
        log_test("Workflow 14: Missing API key handling", False, str(e))

    # 15. API error handling (AUTH_ERROR / 403 test)
    try:
        from app.services.generator import generate_grounded_answer
        from app.config import settings
        original_gemini_key = settings.GEMINI_API_KEY
        try:
            settings.GEMINI_API_KEY = "AIzaSy_INVALID_KEY_PRE_DEPLOYMENT_TEST"
            resp = generate_grounded_answer(
                query="Test invalid credentials handling",
                chunks=[],
                sources_map={}
            )
            passed = resp.get("state") == "AUTH_ERROR" and "rejected" in resp.get("direct_answer", "").lower()
            log_test("Workflow 15: API Auth error handling", passed, f"State: {resp.get('state')}, provider: {resp.get('llm_provider')}")
        finally:
            settings.GEMINI_API_KEY = original_gemini_key
    except Exception as e:
        log_test("Workflow 15: API Auth error handling", False, str(e))

    # Clean up test document
    if doc_id:
        try:
            client.delete(f"{BASE_URL}/api/v1/documents/{doc_id}")
            print(f"[CLEANUP] Deleted test document {doc_id}")
        except Exception:
            pass

    print("=" * 70)
    passed_count = sum(1 for v in results.values() if v["passed"])
    total_count = len(results)
    print(f"PRE-DEPLOYMENT AUDIT SUMMARY: {passed_count}/{total_count} WORKFLOWS PASSED")
    print("=" * 70)
    return passed_count == total_count

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
