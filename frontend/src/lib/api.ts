const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  timestamp: string;
  environment: string;
  database: {
    status: string;
    database: string;
    latency_ms?: number;
    error?: string;
  };
  providers: {
    llm: {
      provider: string;
      model: string;
      configured: boolean;
    };
    embedding: {
      provider: string;
      model: string;
      dimensions: number;
      configured: boolean;
    };
  };
  ready: boolean;
}

export interface IpoSummary {
  id: string;
  company_name: string;
  symbol: string;
  sector: string;
  price_band: string;
  issue_size_cr: number;
  lot_size: number;
  open_date?: string;
  close_date?: string;
  status: string;
  deterministic_score: {
    overall: number;
    fundamentals: number;
    valuation: number;
    risks: number;
    sentiment: number;
    listing: number;
  };
  documents_count: number;
}

export interface ChartSeriesItem {
  fiscal_year: string;
  revenue: number;
  ebitda: number;
  pat: number;
  cfo: number;
  capex: number;
  fcf: number;
  ebitda_margin: number;
  pat_margin: number;
  debt_to_equity: number;
  cfo_to_pat: number;
}

export interface PeerItem {
  peer_name: string;
  pe_ratio: number;
  ev_ebitda: number;
  ronw_pct: number;
  revenue_cr: number;
  market_cap_cr: number;
}

export interface FinancialsResponse {
  ipo_id: string;
  chart_series: ChartSeriesItem[];
  growth_metrics: {
    revenue_cagr_pct: number;
    latest_yoy_growth_pct: number;
    latest_revenue_cr: number;
    latest_ebitda_cr: number;
    latest_pat_cr: number;
    latest_cfo_cr: number;
  };
  quality_of_earnings: {
    divergence_flag: boolean;
    severity: string;
    reason: string;
    cfo_to_pat_ratio: number;
    debt_to_equity: number;
  };
}

export interface PeersResponse {
  ipo_pe: number;
  peer_avg_pe: number;
  pe_discount_pct: number;
  ipo_ev_ebitda: number;
  peer_avg_ev_ebitda: number;
  ev_discount_pct: number;
  peers: PeerItem[];
}

export interface ScorecardResponse {
  ipo_id: string;
  scorecard: {
    overall_score: number;
    verdict: string;
    fundamentals: { score: number; max: number };
    valuation: { score: number; max: number };
    risks: { score: number; max: number };
    sentiment: { score: number; max: number };
    listing_potential: { score: number; max: number };
  };
  investment_horizons: {
    long_term: { verdict: string; confidence: string; thesis: string };
    listing_gains: { verdict: string; confidence: string; thesis: string };
    capital_protection: { verdict: string; confidence: string; thesis: string };
  };
}

export interface DocumentItem {
  id: string;
  ipo_id: string;
  title: string;
  doc_type: string;
  pages: number;
  chunks_count: number;
  status: string;
  origin?: any;
}

export interface ClaimItem {
  text: string;
  chunk_id: string;
  source_title: string;
  page_number: number;
  quote: string;
  quote_start?: number;
  quote_end?: number;
  verified: boolean;
}

export interface ConflictItem {
  topic: string;
  source_a_title: string;
  source_a_statement: string;
  source_b_title: string;
  source_b_statement: string;
  notes?: string;
}

export interface TraceItem {
  chunk_id: string;
  source_id: string;
  page_number: number;
  section_title: string;
  vector_rank: number | null;
  vector_score: number | null;
  lexical_rank: number | null;
  lexical_score: number | null;
  rrf_score: number;
  diversified: boolean;
}

export interface ResearchResponse {
  id: string;
  ipo_id: string;
  question: string;
  mode: string;
  state: "ANSWERED" | "PARTIAL" | "CONFLICTING" | "INSUFFICIENT";
  summary: string;
  direct_answer?: string;
  key_findings?: string[];
  financial_implications?: string;
  risks?: string[];
  claims: ClaimItem[];
  conflicts: ConflictItem[];
  gaps: string[];
  follow_up_questions?: string[];
  llm_provider?: string;
  llm_configured?: boolean;
  trace: TraceItem[];
  latency_ms: Record<string, number>;
  verification_rate: number;
  created_at: string;
}

// Aliases for unified consistency across components
export type IPOData = IpoSummary;
export type ScorecardData = ScorecardResponse;
export type FinancialStatement = ChartSeriesItem;
export type PeerComparison = PeersResponse;
export type QueryResponse = ResearchResponse;
export type Citation = ClaimItem;

export async function fetchHealth(): Promise<HealthResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/health`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err: any) {
    return {
      status: "offline",
      service: "IPO Intelligence API",
      version: "unknown",
      timestamp: new Date().toISOString(),
      environment: "unknown",
      database: { status: "unreachable", database: "unknown", error: err.message },
      providers: {
        llm: { provider: "gemini", model: "gemini-1.5-flash", configured: false },
        embedding: { provider: "gemini", model: "text-embedding-004", dimensions: 768, configured: false },
      },
      ready: false,
    };
  }
}

export async function fetchIpos(): Promise<IpoSummary[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/ipos`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Error fetching IPOs:", err);
    return [];
  }
}

export async function fetchIpoDetails(ipoId: string): Promise<IpoSummary> {
  const res = await fetch(`${API_BASE_URL}/api/v1/ipos/${ipoId}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function fetchIpoFinancials(ipoId: string): Promise<FinancialsResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/ipos/${ipoId}/financials`, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}
export const fetchFinancials = fetchIpoFinancials;

export async function fetchIpoPeers(ipoId: string): Promise<PeersResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/ipos/${ipoId}/peers`, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}
export const fetchPeers = fetchIpoPeers;

export async function fetchIpoScore(ipoId: string): Promise<ScorecardResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/ipos/${ipoId}/score`, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}
export const fetchScorecard = fetchIpoScore;

export async function fetchDocuments(ipoId: string): Promise<DocumentItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/documents?ipo_id=${ipoId}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("Error fetching documents:", err);
    return [];
  }
}

export async function fetchDocumentDetail(sourceId: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/v1/documents/${sourceId}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function executeResearchQuery(
  ipoId: string,
  question: string,
  conversationHistory: Array<{ role: string; content: string }> = []
): Promise<ResearchResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/research/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ipo_id: ipoId,
      question,
      conversation_history: conversationHistory,
    }),
  });
  if (!res.ok) throw new Error(`Query failed: HTTP ${res.status}`);
  return await res.json();
}
export const submitQuery = executeResearchQuery;

export async function searchDocumentChunks(query: string, ipoId?: string): Promise<any[]> {
  try {
    const url = new URL(`${API_BASE_URL}/api/v1/documents/chunks/search`);
    url.searchParams.set("q", query);
    if (ipoId) url.searchParams.set("ipo_id", ipoId);
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error("Error searching document chunks:", err);
    return [];
  }
}

export async function uploadDocumentFile(
  file: File,
  ipoId: string = "ipo_abc_industries",
  docType: string = "report",
  title?: string
): Promise<{ source_id: string; chunks_created: number; status: string; message: string }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("ipo_id", ipoId);
  formData.append("doc_type", docType);
  if (title) formData.append("title", title);

  const res = await fetch(`${API_BASE_URL}/api/v1/documents/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error(`Upload failed: HTTP ${res.status}`);
  return await res.json();
}
