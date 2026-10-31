# Corpus Manifest — IPO Intelligence

## Target Company: ABC Industries Limited
- **Domain:** Clean-tech thermal heat exchangers and industrial components
- **Sector:** Capital Goods / Clean Energy Transition

### Seed Sources Inventory
| Source ID | Document Title | Document Type | Origin / License | Key Topics Covered |
|---|---|---|---|---|
| `src_drhp_abc` | Draft Red Herring Prospectus (DRHP) | `drhp` | SEBI ICDR Format (Demonstration Dataset) | Issue details (₹1,250 Cr), Objects of offer, Risk factors (68.4% top 3 customer concentration, -₹25.4 Cr CFO), Litigation (₹14.2 Cr ITAT) |
| `src_fin_abc` | Restated Financial Statements FY21–FY24 | `financials` | Audited Financial Statement Format | Multi-year Revenue, EBITDA, PAT, Audited Restated Cash Flows showing -₹25.4 Cr CFO divergence, 1.45 D/E |
| `src_broker_apex` | Apex Capital Institutional IPO Note | `report` | Synthetic Equity Research Note | Recommends Subscribe; contains **PLANTED CONFLICT** claiming ₹120 Cr CFO and diversified clients |

### Planted Test Scenarios for Hackathon Judging
1. **Multi-Source Synthesis:** Questions requiring DRHP Objects + Audited Financial statements + Peer multiples.
2. **Planted Contradiction:** Apex Capital report claims ₹120 Cr operational cash generation and no customer reliance, directly contradicting DRHP Section IV and Audited Financial Statement II showing negative ₹25.4 Cr CFO and 68.42% top 3 customer concentration.
3. **Planted Unanswerable:** Queries asking for guaranteed listing gains or order book projections beyond FY26 trigger `INSUFFICIENT` without hallucinations.
