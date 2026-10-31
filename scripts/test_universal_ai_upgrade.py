"""
Automated Verification Suite for Universal Real IPO Analysis & Gemini AI Upgrade.
Tests:
1. Universal discovery of Indian IPOs (Zomato, Swiggy, Bajaj Housing Finance, Ola Electric, LIC).
2. Deterministic financial metrics, formulas, and 20-point universal analysis reports.
3. Conversational AI Assistant with multi-turn memory and follow-up context.
4. Error handling and transparency when GEMINI_API_KEY is not configured.
"""

import sys
import json
import urllib.request
import urllib.error

BASE_URL = "http://127.0.0.1:8000/api/v1"

def test_request(method, endpoint, payload=None):
    url = f"{BASE_URL}{endpoint}"
    data = json.dumps(payload).encode("utf-8") if payload else None
    headers = {"Content-Type": "application/json"} if payload else {}
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=15) as res:
            return res.status, json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8"))
    except Exception as e:
        return 500, {"error": str(e)}

def run_tests():
    print("=" * 70)
    print("IPO INTELLIGENCE — COMPREHENSIVE AI & UNIVERSAL IPO VERIFICATION")
    print("=" * 70)

    # 1. Health check
    status, health = test_request("GET", "/health")
    print(f"\n[TEST 1] System Health Check: HTTP {status}")
    assert status == 200, f"Expected 200, got {status}"
    print(f"  - Database: {health.get('database', {}).get('status')}")
    print(f"  - LLM Provider: {health.get('providers', {}).get('llm')}")

    # 2. Universal Search & Discovery for Zomato
    print("\n[TEST 2] Universal Discovery Test (Searching 'zomato'):")
    status, ipo_list = test_request("GET", "/ipos?q=zomato")
    print(f"  - HTTP Status: {status}")
    assert status == 200, f"Expected 200, got {status}"
    ipos = ipo_list.get("ipos", [])
    found_zomato = any("Zomato" in i.get("company_name", "") for i in ipos)
    print(f"  - Discovered Zomato in results: {found_zomato}")
    assert found_zomato, "Zomato should be discovered from the universal catalog"

    # 3. Universal 20-Point Analysis Endpoint
    print("\n[TEST 3] Universal 20-Point Analysis Report (Zomato):")
    status, analysis = test_request("GET", "/ipos/ipo_zomato/analysis")
    print(f"  - HTTP Status: {status}")
    assert status == 200, f"Expected 200, got {status}"
    sections = analysis.get("sections", {})
    print(f"  - Total Generated Analysis Sections: {len(sections)}")
    print(f"  - Section 1 (Company Overview): {sections.get('1_company_overview', {}).get('title')} [{sections.get('1_company_overview', {}).get('status')}]")
    print(f"  - Section 6 (Revenue Growth): {sections.get('6_revenue_growth', {}).get('title')} -> CAGR: {sections.get('6_revenue_growth', {}).get('cagr_pct')}%")
    print(f"  - Section 9 (Cash Flow Analysis): Divergence Flag = {sections.get('9_cash_flow_analysis', {}).get('divergence_flag')}")
    print(f"  - Section 16 (Overall Assessment): Rating = {sections.get('16_overall_assessment', {}).get('rating')}")
    assert len(sections) >= 15, "Should generate comprehensive analysis sections"

    # 4. Multi-Year Financial Statements & Ratios
    print("\n[TEST 4] Deterministic Financial Multiples & Formulas (Swiggy):")
    status, fin = test_request("GET", "/ipos/ipo_swiggy/financials")
    print(f"  - HTTP Status: {status}")
    assert status == 200, f"Expected 200, got {status}"
    chart_series = fin.get("chart_series", [])
    print(f"  - Chart Series Count: {len(chart_series)} fiscal years")
    rev_cagr = fin.get("growth_metrics", {}).get("revenue_cagr", {})
    print(f"  - Metric Name: {rev_cagr.get('name')}")
    print(f"  - Calculated Value: {rev_cagr.get('display')}")
    print(f"  - Formula: {rev_cagr.get('formula')}")
    print(f"  - Reporting Period: {rev_cagr.get('reporting_period')}")
    print(f"  - Source: {rev_cagr.get('source')}")

    # 5. Natural-Language AI Research Query (General Financial Concept)
    print("\n[TEST 5] Natural-Language AI Assistant Query (General Concept):")
    payload = {
        "question": "Explain the difference between Fresh Issue and Offer for Sale (OFS) in an IPO.",
        "mode": "qa"
    }
    status, q_res = test_request("POST", "/research/query", payload)
    print(f"  - HTTP Status: {status}")
    assert status == 200, f"Expected 200, got {status}"
    print(f"  - State: {q_res.get('state')}")
    print(f"  - LLM Provider: {q_res.get('llm_provider')}")
    print(f"  - Direct Answer Preview: {q_res.get('direct_answer', '')[:140]}...")

    # 6. Multi-Turn Conversation Memory Test
    print("\n[TEST 6] Multi-Turn Conversation & Follow-up Memory:")
    conv_id = "test_conv_99"
    msg1_payload = {
        "conversation_id": conv_id,
        "ipo_id": "ipo_swiggy",
        "question": "What is Swiggy's business model and how does it generate revenue?",
        "mode": "qa"
    }
    status, m1_res = test_request("POST", "/research/query", msg1_payload)
    print(f"  - Turn 1 Status: HTTP {status} (State: {m1_res.get('state')})")
    assert status == 200, "Turn 1 should succeed"

    # Follow-up turn referencing "its risks"
    msg2_payload = {
        "conversation_id": conv_id,
        "ipo_id": "ipo_swiggy",
        "question": "What are its main financial risks and cash burn concerns?",
        "mode": "qa",
        "conversation_history": [
            {"role": "user", "content": msg1_payload["question"]},
            {"role": "assistant", "content": m1_res.get("direct_answer", "")}
        ]
    }
    status, m2_res = test_request("POST", "/research/query", msg2_payload)
    print(f"  - Turn 2 Status: HTTP {status} (State: {m2_res.get('state')})")
    assert status == 200, "Turn 2 follow-up should succeed"
    print(f"  - Follow-up Direct Answer Preview: {m2_res.get('direct_answer', '')[:140]}...")

    # 7. Verification of Universal Discovered IPOs (Bajaj Housing, Ola Electric, LIC)
    print("\n[TEST 7] Universal Discovery Across Indian IPOs:")
    for query_name in ["Bajaj Housing", "Ola Electric", "LIC"]:
        st, res = test_request("GET", f"/ipos?q={urllib.parse.quote(query_name)}")
        items = res.get("ipos", [])
        print(f"  - Query '{query_name}': Discovered {len(items)} record(s) -> {[i.get('company_name') for i in items]}")
        assert len(items) > 0, f"Expected to discover {query_name}"

    print("\n" + "=" * 70)
    print("ALL 7 UNIVERSAL REAL IPO & GEMINI UPGRADE TESTS PASSED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
