"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Building2,
  Calendar,
  Layers,
  FileText,
  DollarSign,
  AlertOctagon,
  CheckCircle2,
  PieChart,
  BarChart3,
  BookOpen,
  Users,
} from "lucide-react";
import { Navbar } from "../../../components/navigation/Navbar";
import { FinancialTooltip } from "../../../components/terminal/FinancialTooltip";
import { FinancialTrendsChart } from "../../../components/charts/FinancialTrendsChart";
import { PeerComparisonChart } from "../../../components/charts/PeerComparisonChart";
import { ScorecardCard } from "../../../components/terminal/ScorecardCard";
import { PassageViewerModal } from "../../../components/terminal/PassageViewerModal";
import {
  fetchIpoDetails,
  fetchIpoScore,
  fetchIpoFinancials,
  fetchIpoPeers,
  type IpoSummary,
  type ScorecardResponse,
  type FinancialsResponse,
  type PeersResponse,
  type ClaimItem,
} from "../../../lib/api";

export default function IpoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ipoId = (params?.id as string) || "ipo_hyundai_motor_india";

  const [ipo, setIpo] = useState<IpoSummary | null>(null);
  const [scoreData, setScoreData] = useState<ScorecardResponse | null>(null);
  const [financialsData, setFinancialsData] = useState<FinancialsResponse | null>(null);
  const [peersData, setPeersData] = useState<PeersResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [activeCitation, setActiveCitation] = useState<ClaimItem | null>(null);
  const [isCitationModalOpen, setIsCitationModalOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      fetchIpoDetails(ipoId),
      fetchIpoScore(ipoId),
      fetchIpoFinancials(ipoId),
      fetchIpoPeers(ipoId),
    ]).then(([ipoRes, scoreRes, finRes, peerRes]) => {
      if (ipoRes.status === "fulfilled") setIpo(ipoRes.value);
      if (scoreRes.status === "fulfilled") setScoreData(scoreRes.value);
      if (finRes.status === "fulfilled") setFinancialsData(finRes.value);
      if (peerRes.status === "fulfilled") setPeersData(peerRes.value);
      setLoading(false);
    });
  }, [ipoId]);

  const companyName = ipo?.company_name || "Indian IPO Offering";
  const symbol = ipo?.symbol || "NSE/BSE";
  const sector = ipo?.sector || "Industrial / Tech";

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-8">
        {/* Navigation Breadcrumb & Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-emerald-400 transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Real IPO Catalog</span>
            </Link>

            <div className="flex items-center gap-3 pt-1">
              <h1 className="text-2xl md:text-3xl font-black text-white font-mono tracking-tight">
                {companyName}
              </h1>
              <span className="px-2.5 py-0.5 rounded text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                {symbol}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                {ipo?.status || "listed"}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Sector: <strong className="text-slate-200">{sector}</strong> &bull; Official SEBI Prospectus &amp; BSE Records
            </p>
          </div>

          {/* Prominent Action: Ask AI About This IPO */}
          <div className="flex items-center gap-3">
            <Link
              href={`/assistant?ipo=${ipoId}`}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-mono text-xs font-bold shadow-lg shadow-emerald-950/50 transition flex items-center gap-2"
            >
              <Bot className="h-4 w-4" />
              <span>Ask AI About This IPO</span>
            </Link>
          </div>
        </div>

        {/* 1. 1-MINUTE ASSESSMENT & SCORECARD HERO */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <ScorecardCard scoreData={scoreData} />
          </div>

          <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-[#0f172a] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Issue Overview &amp; Capital Structure
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-emerald-500/20">
                SEBI Verified
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">TOTAL ISSUE SIZE</span>
                <span className="text-slate-100 font-bold text-sm">
                  ₹{ipo?.issue_size_cr?.toLocaleString("en-IN") || "—"} Cr
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">PRICE BAND</span>
                <span className="text-slate-100 font-bold text-sm">
                  {ipo?.price_band || "—"}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">FRESH / OFS SPLIT</span>
                <span className="text-emerald-400 font-semibold">
                  {ipo?.fresh_issue_cr !== undefined && ipo?.ofs_cr !== undefined
                    ? `₹${ipo.fresh_issue_cr} Cr Fresh / ₹${ipo.ofs_cr} Cr OFS`
                    : "As per Prospectus"}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">LOT SIZE / RETAIL MIN</span>
                <span className="text-slate-200 font-medium">
                  {ipo?.lot_size || 0} Shares ({ipo?.retail_min_investment ? `₹${ipo.retail_min_investment.toLocaleString("en-IN")}` : "1 Lot"})
                </span>
              </div>
            </div>

            {/* Subscription Demand Snapshot */}
            {ipo?.subscription_status && (
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Total Bidding Demand:</span>
                  <span className="font-bold text-emerald-400">{ipo.subscription_status.overall_multiple}x</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-center">
                  <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[9px]">QIB</span>
                    <span className="text-slate-200 font-semibold">{ipo.subscription_status.qib_multiple}x</span>
                  </div>
                  <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[9px]">NII (HNI)</span>
                    <span className="text-slate-200 font-semibold">{ipo.subscription_status.nii_multiple}x</span>
                  </div>
                  <div className="bg-slate-900 p-1.5 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[9px]">Retail (RII)</span>
                    <span className="text-slate-200 font-semibold">{ipo.subscription_status.retail_multiple}x</span>
                  </div>
                </div>
              </div>
            )}

            {/* Listing Performance */}
            {ipo?.listing_gain_pct !== undefined && ipo?.listing_gain_pct !== null && (
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Listing Day Performance:</span>
                <span
                  className={`font-bold flex items-center gap-1 ${
                    ipo.listing_gain_pct >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {ipo.listing_gain_pct >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                  {ipo.listing_gain_pct >= 0 ? `+${ipo.listing_gain_pct}%` : `${ipo.listing_gain_pct}%`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 2. DYNAMIC FINANCIAL GRAPHS */}
        <div className="rounded-2xl border border-slate-800 bg-[#0b101d] p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-emerald-400" />
                Audited Financial Trends (Revenue, EBITDA &amp; Operating Cash Flow)
              </h2>
              <p className="text-xs text-slate-400">
                Multi-year historical statements extracted from official SEBI prospectus filings (₹ in Crores)
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500">Source: Restated SEBI Financials</span>
          </div>

          <FinancialTrendsChart series={financialsData?.chart_series || []} />
        </div>

        {/* 3. PEER COMPARISON MULTIPLES */}
        <div className="rounded-2xl border border-slate-800 bg-[#0b101d] p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <PieChart className="h-4 w-4 text-blue-400" />
                Valuation Multiples vs. Listed Competitor Peers
              </h2>
              <p className="text-xs text-slate-400">
                P/E and EV/EBITDA multiples benchmarked against established Indian listed peers
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500">BSE/NSE Market Data</span>
          </div>

          <PeerComparisonChart data={peersData} />
        </div>

        {/* 4. KEY PARTIES & REGISTRAR */}
        {ipo?.key_parties && (
          <div className="rounded-2xl border border-slate-800 bg-[#0b101d] p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Users className="h-4 w-4 text-purple-400" />
              <h3 className="text-sm font-semibold text-slate-200 font-mono uppercase tracking-wider">
                Key Parties &amp; Issue Intermediaries
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-slate-400 text-[11px] block font-semibold">BOOK RUNNING LEAD MANAGERS (BRLMs)</span>
                <ul className="space-y-1 text-slate-200">
                  {ipo.key_parties.lead_managers?.map((lm) => (
                    <li key={lm} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      <span>{lm}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-slate-400 text-[11px] block font-semibold">REGISTRAR TO THE OFFER</span>
                <p className="text-slate-100 font-bold text-sm">{ipo.key_parties.registrar}</p>
                {ipo.key_parties.registrar_url && (
                  <a
                    href={ipo.key_parties.registrar_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:underline pt-1"
                  >
                    <span>Check Allotment Portal</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 5. SUMMARY DESCRIPTION */}
        {ipo?.summary && (
          <div className="rounded-2xl border border-slate-800 bg-[#0b101d] p-6 space-y-3">
            <h3 className="text-sm font-semibold text-slate-200 font-mono uppercase tracking-wider flex items-center gap-2">
              <Building2 className="h-4 w-4 text-emerald-400" /> Business Overview &amp; Market Position
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">{ipo.summary}</p>
          </div>
        )}
      </main>

      {/* Primary Source Document Passage Viewer Modal */}
      <PassageViewerModal
        citation={activeCitation}
        isOpen={isCitationModalOpen}
        onClose={() => setIsCitationModalOpen(false)}
      />
    </div>
  );
}
