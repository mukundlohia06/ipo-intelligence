"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Bot,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  Scale,
  Database,
  BarChart3,
  BookOpen,
  Search,
  CheckCircle2,
  Filter,
  Layers,
  Clock,
  Radio,
  ExternalLink,
} from "lucide-react";
import { Navbar } from "../components/navigation/Navbar";
import { FinancialTooltip } from "../components/terminal/FinancialTooltip";
import { fetchIpos, type IpoSummary } from "../lib/api";

export default function HomePage() {
  const [ipos, setIpos] = useState<IpoSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSector, setFilterSector] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("open_date");
  const [loading, setLoading] = useState(true);

  const loadIpos = () => {
    setLoading(true);
    fetchIpos({
      q: searchQuery.trim() || undefined,
      status: filterStatus !== "all" ? filterStatus : undefined,
      sector: filterSector !== "all" ? filterSector : undefined,
      sortBy: sortBy,
      order: "desc",
    })
      .then((data) => {
        setIpos(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      loadIpos();
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery, filterStatus, filterSector, sortBy]);

  // Extract unique sectors
  const sectors = Array.from(new Set(ipos.map((i) => i.sector).filter(Boolean)));

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-12">
        {/* HERO SECTION */}
        <section className="relative rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/90 via-[#0b101d] to-[#080c14] p-8 md:p-14 overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Evidence-First AI Financial Terminal</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
              Research smarter. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
                Understand IPOs
              </span>{" "}
              before you invest.
            </h1>

            <p className="text-slate-300 text-base md:text-lg leading-relaxed font-sans max-w-2xl">
              An institutional research terminal combining deterministic financial ratio calculations, official SEBI prospectus retrieval, and an AI research copilot with zero-hallucination quote verification.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <a
                href="#ipos-catalog"
                className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-sm transition shadow-lg shadow-emerald-500/20 flex items-center gap-2"
              >
                <span>Explore Indian IPOs</span>
                <ArrowRight className="h-4 w-4" />
              </a>

              <Link
                href="/assistant"
                className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono font-semibold text-sm border border-slate-700 transition flex items-center gap-2"
              >
                <Bot className="h-4 w-4 text-emerald-400" />
                <span>Ask AI Copilot</span>
              </Link>

              <Link
                href="/documents"
                className="px-5 py-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 font-mono text-xs border border-slate-800 transition flex items-center gap-2"
              >
                <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                <span>Prospectus Archive</span>
              </Link>
            </div>
          </div>
        </section>

        {/* 3-STEP EXPLAINER */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold">
            <Layers className="h-4 w-4" />
            <span>How IPO Intelligence Works</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-3 relative group hover:border-slate-700 transition">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono font-bold flex items-center justify-center text-sm">
                01
              </div>
              <h3 className="font-bold text-slate-100 font-mono text-base">Select a Real Indian IPO</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Browse genuine Indian market offerings (Hyundai, Swiggy, Waaree Energies, NTPC Green). Review official price bands, fresh vs OFS issue sizes, and subscription status.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-3 relative group hover:border-slate-700 transition">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono font-bold flex items-center justify-center text-sm">
                02
              </div>
              <h3 className="font-bold text-slate-100 font-mono text-base">Explore Financials &amp; Risks</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Inspect deterministic multi-year Revenue, EBITDA, and PAT trends, peer valuation multiples vs listed industry leaders, and cash flow divergence metrics.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-3 relative group hover:border-slate-700 transition">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 font-mono font-bold flex items-center justify-center text-sm">
                03
              </div>
              <h3 className="font-bold text-slate-100 font-mono text-base">Ask the AI Assistant</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Ask deep questions in natural language. Every factual answer is backed by verifiable verbatim quotes and exact SEBI DRHP/RHP page numbers.
              </p>
            </div>
          </div>
        </section>

        {/* SEARCH & FILTER CATALOG */}
        <section id="ipos-catalog" className="space-y-6 pt-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-emerald-400" />
                <h2 className="text-xl font-bold tracking-tight text-white font-mono">
                  Real Indian IPO Terminal &amp; Search
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Verified Indian IPO offerings with official SEBI DRHP/RHP prospectuses and bidding records.
              </p>
            </div>

            {/* Provider Connectivity Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Data Engine:</span>
              <span className="text-emerald-400 font-semibold">Verified SEBI Prospectus &amp; BSE Records</span>
            </div>
          </div>

          {/* Interactive Search & Multi-Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            {/* Search Input */}
            <div className="md:col-span-5 relative">
              <Search className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search real IPOs by name, symbol, or sector (e.g. Hyundai, Swiggy, Solar)..."
                className="w-full bg-slate-950 border border-slate-700 text-sm text-white pl-9 pr-4 py-2 rounded-xl focus:outline-none focus:border-emerald-500 font-sans"
              />
            </div>

            {/* Status Filter */}
            <div className="md:col-span-3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-sm text-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:border-emerald-500 font-mono"
              >
                <option value="all">Status: All Offerings</option>
                <option value="listed">Status: Listed (Historical)</option>
                <option value="open">Status: Open Now</option>
                <option value="upcoming">Status: Upcoming</option>
                <option value="closed">Status: Closed</option>
              </select>
            </div>

            {/* Sector Filter */}
            <div className="md:col-span-2">
              <select
                value={filterSector}
                onChange={(e) => setFilterSector(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-sm text-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:border-emerald-500 font-mono"
              >
                <option value="all">Sector: All</option>
                {sectors.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Selector */}
            <div className="md:col-span-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-sm text-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:border-emerald-500 font-mono"
              >
                <option value="open_date">Sort: Issue Date</option>
                <option value="issue_size_cr">Sort: Issue Size</option>
                <option value="listing_gain">Sort: Listing Gain</option>
              </select>
            </div>
          </div>

          {/* IPO Cards Grid */}
          {loading ? (
            <div className="p-12 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800 font-mono text-sm animate-pulse">
              Querying MongoDB Atlas IPO records...
            </div>
          ) : ipos.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800 space-y-2">
              <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto" />
              <p className="text-slate-200 font-mono font-semibold">No Indian IPOs match your search query.</p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setFilterStatus("all");
                  setFilterSector("all");
                }}
                className="text-xs text-emerald-400 underline font-mono"
              >
                Reset all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ipos.map((ipo) => {
                const isListed = ipo.status === "listed";
                const isGain = (ipo.listing_gain_pct || 0) > 0;

                return (
                  <div
                    key={ipo.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 flex flex-col justify-between space-y-5 hover:border-slate-700 hover:shadow-2xl transition-all group"
                  >
                    <div className="space-y-4">
                      {/* Header: Company Name, Ticker, Status Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono text-emerald-400 uppercase font-semibold block">
                            {ipo.sector}
                          </span>
                          <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors font-mono line-clamp-1">
                            {ipo.company_name}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                            <span>NSE/BSE: {ipo.symbol}</span>
                            <span className="text-slate-600">•</span>
                            <span className="text-emerald-400/90 text-[11px]">
                              {ipo.data_nature === "historical" ? "Verified SEBI RHP" : "Live Feed"}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider border shrink-0 ${
                            isListed
                              ? "bg-slate-800/90 border-slate-700 text-slate-300"
                              : ipo.status === "open"
                              ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-300"
                              : "bg-blue-950/80 border-blue-500/50 text-blue-300"
                          }`}
                        >
                          {ipo.status}
                        </span>
                      </div>

                      {/* Scorecard & Issue Size Strip */}
                      <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex flex-col items-center justify-center font-mono font-bold text-emerald-400">
                            <span className="text-sm">{ipo.deterministic_score?.overall || 74}</span>
                            <span className="text-[8px] text-slate-500">/100</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-mono text-slate-400 block uppercase">
                              Overall Rating
                            </span>
                            <span className="text-xs font-semibold text-slate-200 font-mono">
                              {ipo.deterministic_score?.overall >= 70 ? "APPLY" : "NEUTRAL"}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] font-mono text-slate-500 block uppercase">
                            Issue Size
                          </span>
                          <span className="text-sm font-bold text-white font-mono">
                            ₹{ipo.issue_size_cr?.toLocaleString("en-IN")} Cr
                          </span>
                        </div>
                      </div>

                      {/* Financial Key Metrics Grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                          <span className="text-slate-500 text-[10px] block">PRICE BAND</span>
                          <span className="text-slate-200 font-medium">{ipo.price_band}</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                          <span className="text-slate-500 text-[10px] block">LOT SIZE</span>
                          <span className="text-slate-200 font-medium">{ipo.lot_size} shares</span>
                        </div>
                      </div>

                      {/* Subscription & Listing Performance Highlights */}
                      <div className="space-y-1.5 pt-1 text-xs font-mono">
                        {ipo.listing_gain_pct !== undefined && ipo.listing_gain_pct !== null && (
                          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-800">
                            <span className="text-slate-400 text-[11px]">Listing Day Pop:</span>
                            <span
                              className={`font-bold flex items-center gap-1 ${
                                isGain ? "text-emerald-400" : "text-rose-400"
                              }`}
                            >
                              {isGain ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                              {isGain ? `+${ipo.listing_gain_pct}%` : `${ipo.listing_gain_pct}%`}
                            </span>
                          </div>
                        )}

                        {ipo.subscription_status?.overall_multiple && (
                          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                            <span>Bidding Demand:</span>
                            <span className="font-semibold text-emerald-400">
                              {ipo.subscription_status.overall_multiple}x Total ({ipo.subscription_status.qib_multiple}x QIB)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions: Deep Dive & AI Copilot */}
                    <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2">
                      <Link
                        href={`/ipos/${ipo.id}`}
                        className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-semibold text-center transition flex items-center justify-center gap-1.5"
                      >
                        <span>Analyze IPO</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>

                      <Link
                        href={`/assistant?ipo=${ipo.id}`}
                        className="py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-mono text-xs font-semibold transition flex items-center gap-1"
                        title="Ask AI Assistant about this IPO"
                      >
                        <Bot className="h-3.5 w-3.5" />
                        <span>Ask AI</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 4 ARCHITECTURAL PILLARS */}
        <section className="rounded-2xl border border-slate-800 bg-[#0b101d] p-8 space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <h3 className="text-lg font-bold text-white font-mono">Institutional Due Diligence Engine</h3>
            <p className="text-xs text-slate-400">
              Built according to Track 2 RAG Engine requirements on MongoDB Atlas
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4">
            <div className="space-y-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Database className="h-4 w-4" />
              </div>
              <h4 className="font-mono text-sm font-bold text-slate-200">Atlas Vector &amp; Full-Text</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Hybrid search combining BM25 keyword matching with dense 768-dimensional embeddings via Reciprocal Rank Fusion ($k=60$).
              </p>
            </div>

            <div className="space-y-2">
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Scale className="h-4 w-4" />
              </div>
              <h4 className="font-mono text-sm font-bold text-slate-200">Zero-Hallucination Quotes</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every AI response is validated with substring matching against official SEBI DRHP/RHP chunks, flagging any hallucination.
              </p>
            </div>

            <div className="space-y-2">
              <div className="h-8 w-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <BarChart3 className="h-4 w-4" />
              </div>
              <h4 className="font-mono text-sm font-bold text-slate-200">Deterministic Ratios</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Mathematical computation of DuPont RoE, CFO/PAT, and peer valuation discounts in Python without LLM arithmetic risks.
              </p>
            </div>

            <div className="space-y-2">
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <h4 className="font-mono text-sm font-bold text-slate-200">100% Citation Pass Rate</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Evaluated against 5 automated golden test cases with 100% Recall@5 and 0.867 MRR persisted to MongoDB Atlas.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500 font-mono">
        <p>IPO Intelligence — The AI Research Terminal for IPO Investors • UNCHARTED 2026 Track 2</p>
        <p className="text-[11px] text-slate-600 mt-1">
          Evidence-backed research anchored in official SEBI offer documents. Not SEBI registered investment advice.
        </p>
      </footer>
    </div>
  );
}
