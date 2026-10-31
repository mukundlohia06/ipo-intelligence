export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8000"
).replace(/\/$/, "");

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
  fresh_issue_cr?: number;
  ofs_cr?: number;
  lot_size: number;
  retail_min_investment?: number;
  open_date?: string;
  close_date?: string;
  listing_date?: string;
  listing_gain_pct?: number;
  status: string;
  data_nature?: "historical" | "live" | "sample" | string;
  is_sample?: boolean;
  summary?: string;
  subscription_status?: {
    qib_multiple?: number;
    nii_multiple?: number;
    retail_multiple?: number;
    employee_multiple?: number;
    overall_multiple?: number;
    as_of?: string;
  };
  key_parties?: {
    lead_managers?: string[];
    registrar?: string;
    registrar_url?: string;
  };
  source_reference?: {
    document?: string;
    filing_date?: string;
    sebi_link?: string;
    verified?: boolean;
  };
  deterministic_score: {
    overall: number;
    fundamentals: number;
    valuation: number;
    risks: number;
    sentiment: number;
    listing: number;
  };
  documents_count: number;
  last_synced_at?: string;
}

export interface IpoSearchResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  live_connected: boolean;
  provider_message: string;
  ipos: IpoSummary[];
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
  state: "ANSWERED" | "PARTIAL" | "CONFLICTING" | "INSUFFICIENT" | "UNCONFIGURED" | string;
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

export async function fetchIpos(filters?: {
  q?: string;
  status?: string;
  sector?: string;
  sortBy?: string;
  order?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}): Promise<IpoSummary[]> {
  try {
    const url = new URL(`${API_BASE_URL}/api/v1/ipos`);
    if (filters?.q) url.searchParams.set("q", filters.q);
    if (filters?.status && filters.status !== "all") url.searchParams.set("status", filters.status);
    if (filters?.sector && filters.sector !== "all") url.searchParams.set("sector", filters.sector);
    if (filters?.sortBy) url.searchParams.set("sort_by", filters.sortBy);
    if (filters?.order) url.searchParams.set("order", filters.order);
    if (filters?.page) url.searchParams.set("page", String(filters.page));
    if (filters?.pageSize) url.searchParams.set("page_size", String(filters.pageSize));

    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data)) return data;
    return data.ipos || [];
  } catch (err) {
    console.error("Error fetching IPOs:", err);
    return [];
  }
}

export async function searchIpos(filters?: {
  q?: string;
  status?: string;
  sector?: string;
  sortBy?: string;
  order?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}): Promise<IpoSearchResponse> {
  const url = new URL(`${API_BASE_URL}/api/v1/ipos`);
  if (filters?.q) url.searchParams.set("q", filters.q);
  if (filters?.status && filters.status !== "all") url.searchParams.set("status", filters.status);
  if (filters?.sector && filters.sector !== "all") url.searchParams.set("sector", filters.sector);
  if (filters?.sortBy) url.searchParams.set("sort_by", filters.sortBy);
  if (filters?.order) url.searchParams.set("order", filters.order);
  if (filters?.page) url.searchParams.set("page", String(filters.page));
  if (filters?.pageSize) url.searchParams.set("page_size", String(filters.pageSize));

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (Array.isArray(data)) {
    return {
      total: data.length,
      page: 1,
      page_size: data.length,
      total_pages: 1,
      live_connected: false,
      provider_message: "Historical SEBI filings",
      ipos: data,
    };
  }
  return data;
}

export async function fetchProviderStatus(): Promise<any> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/ipos/provider/status`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
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

export async function fetchDocuments(ipoId?: string): Promise<DocumentItem[]> {
  try {
    const query = ipoId && ipoId !== "all" ? `?ipo_id=${ipoId}` : "";
    const res = await fetch(`${API_BASE_URL}/api/v1/documents${query}`, { cache: "no-store" });
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

export async function deleteDocument(sourceId: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/v1/documents/${sourceId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`Delete failed: HTTP ${res.status}`);
  return await res.json();
}

export async function executeResearchQuery(
  ipoId: string,
  question: string,
  conversationHistory: Array<{ role: string; content: string }> = [],
  docId?: string,
  conversationId?: string
): Promise<ResearchResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/research/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conversation_id: conversationId || undefined,
      ipo_id: ipoId,
      doc_id: docId || undefined,
      question,
      conversation_history: conversationHistory,
    }),
  });
  if (!res.ok) throw new Error(`Query failed: HTTP ${res.status}`);
  return await res.json();
}
export const submitQuery = executeResearchQuery;

export async function fetchUniversalAnalysis(ipoId: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/v1/ipos/${ipoId}/analysis`, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export async function clearConversation(conversationId: string): Promise<any> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/research/conversations/${conversationId}`, {
      method: "DELETE",
    });
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function searchDocumentChunks(query: string, ipoId?: string, docId?: string): Promise<any[]> {
  try {
    const url = new URL(`${API_BASE_URL}/api/v1/documents/chunks/search`);
    url.searchParams.set("q", query);
    if (ipoId && ipoId !== "all") url.searchParams.set("ipo_id", ipoId);
    if (docId) url.searchParams.set("doc_id", docId);
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
  ipoId: string = "ipo_hyundai_motor_india",
  docType: string = "prospectus",
  title?: string
): Promise<{ source_id: string; chunks_created: number; chunks_count: number; pages: number; status: string; message: string }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("ipo_id", ipoId);
  formData.append("doc_type", docType);
  if (title) formData.append("title", title);

  const res = await fetch(`${API_BASE_URL}/api/v1/documents/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    let errDetail = `Upload failed: HTTP ${res.status}`;
    try {
      const errJson = await res.json();
      if (errJson?.detail) errDetail = errJson.detail;
    } catch (_) {}
    throw new Error(errDetail);
  }
  return await res.json();
}
