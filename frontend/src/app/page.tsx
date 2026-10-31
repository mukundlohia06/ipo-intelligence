import { fetchHealth, fetchIpos } from "../lib/api";
import { 
  ShieldCheck, 
  Database, 
  Sparkles, 
  Cpu, 
  ArrowRight, 
  FileText, 
  TrendingUp, 
  AlertTriangle,
  Scale,
  CheckCircle2,
  Activity
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const health = await fetchHealth();
  const ipos = await fetchIpos();
  const primaryIpo = ipos.length > 0 ? ipos[0] : null;

  return (
    <div className="flex min-h-screen flex-col bg-[#090d16] text-slate-100">
      {/* Terminal Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-[#0c1220]/80 backdrop-blur sticky top-0 z-50 px-6 py-3.5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg tracking-wider">
              IPO
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-100 tracking-tight">IPO Intelligence</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Track 2 RAG Terminal
                </span>
              </div>
              <p className="text-xs text-slate-400">The Evidence-First AI Research Terminal for IPO Investors</p>
            </div>
          </div>

          {/* Live System Diagnostics Pills */}
          <div className="flex items-center gap-2 font-mono text-xs">
            {/* Backend Status */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
              health.status === "online" 
                ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-400" 
                : "bg-red-950/40 border-red-800/60 text-red-400"
            }`}>
              <Activity className="h-3 w-3 animate-pulse" />
              <span>API: {health.status === "online" ? "Online" : "Offline"}</span>
            </div>

            {/* MongoDB Atlas Status */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
              health.database.status === "connected" 
                ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-400" 
                : "bg-amber-950/40 border-amber-800/60 text-amber-400"
            }`}>
              <Database className="h-3 w-3" />
              <span>
                Atlas: {health.database.status === "connected" 
                  ? `${health.database.latency_ms}ms` 
                  : "Checking"}
              </span>
            </div>

            {/* Model & Dims */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border bg-slate-900 border-slate-800 text-slate-300">
              <Cpu className="h-3 w-3 text-cyan-400" />
              <span>{health.providers.embedding.dimensions}d Vectors</span>
            </div>

            {/* Judge Mode Pill */}
            <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-semibold">
              Judge Ready
            </span>
          </div>
        </div>
      </header>

      {/* Main Terminal Body */}
      <main className="flex-1 px-6 py-8 max-w-7xl mx-auto w-full space-y-8">
        
        {/* Banner Section */}
        <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-[#0f172a] via-[#090d16] to-[#0c1322] p-8 shadow-2xl">
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="h-3.5 w-3.5" />
              Zero-Hallucination Verification Protocol · UNCHARTED 2026
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-white">
              Investigate IPOs with Verifiable Citations and Audited Financial Evidence.
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Never rely on blind AI summaries. IPO Intelligence cross-examines DRHP prospectuses, restated cash flows, peer multiples, and risk disclosures to deliver traceable conclusions with highlighted source quotes.
            </p>
          </div>
          
          <div className="absolute right-0 top-0 -mt-12 -mr-12 h-96 w-96 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
        </section>

        {/* Target IPO Spotlight Card (ABC Industries) */}
        {primaryIpo && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white tracking-tight">Active Target IPO Investigation</h2>
                <p className="text-xs text-slate-400">Curated multi-document corpus with planted conflict & unanswerable test scenarios</p>
              </div>
              <span className="text-xs font-mono text-emerald-400 px-2 py-1 rounded bg-emerald-950/40 border border-emerald-800/40">
                Corpus Status: 3 Documents Ingested
              </span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-6 transition-all hover:border-slate-700">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                
                {/* Left: Company Details */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xl">
                      ABC
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white tracking-tight">{primaryIpo.company_name}</h3>
                      <p className="text-xs text-slate-400">{primaryIpo.sector}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2">
                    <div className="rounded bg-slate-900/60 p-2 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Price Band</span>
                      <span className="font-semibold text-white">{primaryIpo.price_band}</span>
                    </div>
                    <div className="rounded bg-slate-900/60 p-2 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Issue Size</span>
                      <span className="font-semibold text-white">₹{primaryIpo.issue_size_cr} Cr</span>
                    </div>
                  </div>
                </div>

                {/* Middle: Deterministic 5-Dimension Scorecard */}
                <div className="rounded-lg bg-slate-900/40 border border-slate-800/80 p-4 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">Terminal Health Score</span>
                    <span className="font-mono text-sm font-bold text-emerald-400">
                      {primaryIpo.deterministic_score.overall}/100
                    </span>
                  </div>

                  {/* Dimension Bars */}
                  <div className="space-y-1.5 text-[11px] font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>Fundamentals (30%)</span>
                      <span className="text-slate-200">{primaryIpo.deterministic_score.fundamentals}/30</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(primaryIpo.deterministic_score.fundamentals / 30) * 100}%` }} />
                    </div>

                    <div className="flex justify-between text-slate-400">
                      <span>Valuation vs Peers (20%)</span>
                      <span className="text-slate-200">{primaryIpo.deterministic_score.valuation}/20</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${(primaryIpo.deterministic_score.valuation / 20) * 100}%` }} />
                    </div>

                    <div className="flex justify-between text-slate-400">
                      <span>Business & Risk (25%)</span>
                      <span className="text-slate-200">{primaryIpo.deterministic_score.risks}/25</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: `${(primaryIpo.deterministic_score.risks / 25) * 100}%` }} />
                    </div>
                  </div>
                </div>

                {/* Right: Quick Action Launch Terminal */}
                <div className="flex flex-col gap-3 justify-center">
                  <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3 text-xs text-slate-300">
                    <div className="font-semibold text-emerald-400 mb-1 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" />
                      Ready for Live Investigation
                    </div>
                    Contains 412-page DRHP extract, audited cash flows, and peer benchmarking ready for RAG querying.
                  </div>

                  <Link 
                    href={`/ipo/${primaryIpo.id}`}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition-all hover:bg-emerald-400 active:scale-[0.98] shadow-lg shadow-emerald-500/10"
                  >
                    <span>Launch Research Terminal</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

              </div>
            </div>
          </section>
        )}

        {/* Milestone 1 Diagnostic & Architectural Readiness Panel */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white tracking-tight">Milestone 1 Architecture Verification</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Box 1: FastAPI Microservice */}
            <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <CheckCircle2 className="h-4 w-4" />
                FastAPI Backend (Python 3.11+)
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                PyMuPDF C-engine, Pydantic v2 schemas, and asynchronous routing running at port 8000.
              </p>
              <div className="font-mono text-[11px] text-slate-300 pt-1">
                Endpoints: <span className="text-emerald-400">/health, /ipos, /documents, /research, /eval</span>
              </div>
            </div>

            {/* Box 2: MongoDB Atlas */}
            <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
                <CheckCircle2 className="h-4 w-4" />
                MongoDB Atlas Architecture
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Single store for sources, chunks, 1024d/768d vectors, and structured financial balances.
              </p>
              <div className="font-mono text-[11px] text-slate-300 pt-1">
                Hybrid Retrieval: <span className="text-cyan-400">$vectorSearch + $search (BM25)</span>
              </div>
            </div>

            {/* Box 3: Trust & Verifier */}
            <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                <CheckCircle2 className="h-4 w-4" />
                Deterministic Citation Verifier
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every claim requires a verbatim quote matching chunk text; unverifiable claims are dropped.
              </p>
              <div className="font-mono text-[11px] text-slate-300 pt-1">
                Trust Rule: <span className="text-amber-400">No Receipt → No Claim Emitted</span>
              </div>
            </div>

          </div>
        </section>

      </main>

      {/* Compliance & Event Footer */}
      <footer className="border-t border-slate-800 bg-[#0b1120] px-6 py-4 mt-auto text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <span className="font-semibold text-slate-300">IPO Intelligence</span> · UNCHARTED 2026 (NEXUS × SVNIT Surat)
          </div>
          <div className="text-[11px] text-slate-400">
            For hackathon demonstration and educational evaluation only. Not registered with SEBI as an investment advisor.
          </div>
        </div>
      </footer>
    </div>
  );
}
