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
  sector: string;
  price_band: string;
  issue_size_cr: number;
  lot_size: number;
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

export async function fetchHealth(): Promise<HealthResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/health`, {
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Health check returned HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err: any) {
    return {
      status: "offline",
      service: "IPO Intelligence API",
      version: "unknown",
      timestamp: new Date().toISOString(),
      environment: "unknown",
      database: {
        status: "unreachable",
        database: "unknown",
        error: err.message || "Failed to reach backend",
      },
      providers: {
        llm: { provider: "gemini", model: "unknown", configured: false },
        embedding: { provider: "gemini", model: "unknown", dimensions: 768, configured: false },
      },
      ready: false,
    };
  }
}

export async function fetchIpos(): Promise<IpoSummary[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/ipos`, {
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch IPOs: HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error("Error fetching IPOs:", err);
    return [];
  }
}
