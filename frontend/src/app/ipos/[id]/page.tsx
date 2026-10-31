"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  Bot,
  ArrowLeft,
  FileText,
  Scale,
  DollarSign,
  Activity,
  Layers,
  ChevronRight,
  Sparkles,
  AlertOctagon,
  CheckCircle2,
  PieChart,
  BarChart3,
  BookOpen,
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
  const ipoId = (params?.id as string) || "ipo_abc_industries";

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

  const isAbc = ipoId === "ipo_abc_industries";
  const isZenith = ipoId === "ipo_zenith_technologies";
  const isSolar = ipoId === "ipo_solar_grid_infra";

  const companyName = ipo?.company_name || (isAbc ? "ABC Industries Limited" : isZenith ? "Zenith Cloud & AI Technologies Limited" : "SolarGrid Infrastructure Limited");
  const symbol = ipo?.symbol || (isAbc ? "ABCIND" : isZenith ? "ZENITHAI" : "SOLARGRID");
  const sector = ipo?.sector || (isAbc ? "Industrial Engineering & Clean Tech" : isZenith ? "Enterprise SaaS & AI Infrastructure" : "Renewable Power & Transmission");

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
              <span>Back to IPO Catalog</span>
            </Link>

            <div className="flex items-center gap-3 pt-1">
              <h1 className="text-2xl md:text-3xl font-black text-white font-mono tracking-tight">
                {companyName}
              </h1>
              <span className="px-2.5 py-0.5 rounded text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                {symbol}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Sector: <strong className="text-slate-200">{sector}</strong> &bull; Primary SEBI DRHP Filing Research
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
                Issue Overview & Capital Structure
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                Official Prospectus
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">TOTAL ISSUE SIZE</span>
                <span className="text-slate-100 font-bold text-sm">
                  ₹{ipo?.issue_size_cr || (isAbc ? 1250 : isZenith ? 850 : 1800)} Cr
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">PRICE BAND</span>
                <span className="text-slate-100 font-bold text-sm">
                  {ipo?.price_band || (isAbc ? "₹380 - ₹400" : isZenith ? "₹620 - ₹655" : "₹210 - ₹225")}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">FRESH / OFS SPLIT</span>
                <span className="text-emerald-400 font-semibold">
                  {isAbc ? "64% Fresh / 36% OFS" : isZenith ? "71% Fresh / 29% OFS" : "78% Fresh / 22% OFS"}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500 text-[10px] block">
                  <FinancialTooltip term="pe">IMPLIED P/E MULTIPLE</FinancialTooltip>
                </span>
                <span className="text-slate-100 font-semibold">
                  {isAbc ? "32.4x (20.4% Discount)" : isZenith ? "48.5x (Premium)" : "28.2x"}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs font-sans text-slate-300 space-y-1">
              <span className="font-mono text-slate-400 text-[10px] uppercase block font-semibold">
                Business Model Summary
              </span>
              <p className="leading-relaxed">
                {isAbc
                  ? "Engineering leader specialized in automated clean-tech heat transfer equipment, industrial turbines, and hydrogen-ready pressure systems with operations anchored in Sanand, Gujarat."
                  : isZenith
                  ? "B2B enterprise SaaS cloud platform delivering predictive infrastructure monitoring and agentic AI deployment pipelines for Fortune 500 customers."
                  : "Turnkey EPC infrastructure developer executing high-voltage power transmission grids, solar evacuation substations, and battery storage networks."}
              </p>
            </div>
          </div>
        </div>

        {/* 2. RECHARTS FINANCIAL PERFORMANCE & QUALITY OF EARNINGS */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white font-mono">
              Audited Multi-Year Financial Performance (FY22 – FY24)
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7">
              <FinancialTrendsChart
                series={financialsData?.chart_series || []}
                divergenceAlert={
                  financialsData?.quality_of_earnings
                    ? {
                        flag: financialsData.quality_of_earnings.divergence_flag,
                        reason: financialsData.quality_of_earnings.reason,
                        severity: financialsData.quality_of_earnings.severity,
                      }
                    : undefined
                }
              />
            </div>

            <div className="lg:col-span-5">
              <PeerComparisonChart data={peersData} loading={loading} />
            </div>
          </div>
        </div>

        {/* 3. BALANCE SHEET & DEBT POSITION */}
        <div className="rounded-2xl border border-slate-800 bg-[#0f172a] p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-slate-200 font-mono uppercase tracking-wider flex items-center gap-2">
              <Scale className="h-4 w-4 text-blue-400" />
              Balance Sheet Health & Deleveraging Roadmap
            </h3>
            <span className="text-xs font-mono text-slate-400">Statutory Auditor Restated Accounts</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] block">GROSS BORROWINGS</span>
              <span className="text-white font-bold text-sm">
                ₹{isAbc ? "340.0" : isZenith ? "15.0" : "1420.0"} Cr
              </span>
              <span className="text-[10px] text-slate-400 block">
                {isAbc ? "₹250 Cr retired via fresh issue" : isZenith ? "Virtually zero debt" : "High leverage"}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] block">
                <FinancialTooltip term="debt_equity">DEBT-TO-EQUITY</FinancialTooltip>
              </span>
              <span className="text-emerald-400 font-bold text-sm">
                {isAbc ? "0.88x (falls to 0.23x post-IPO)" : isZenith ? "0.05x (Clean)" : "1.35x (Elevated)"}
              </span>
              <span className="text-[10px] text-slate-400 block">Post-Issue Deleveraging</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] block">
                <FinancialTooltip term="ronw">RETURN ON NET WORTH (RoNW)</FinancialTooltip>
              </span>
              <span className="text-emerald-400 font-bold text-sm">
                {isAbc ? "23.4%" : isZenith ? "25.8%" : "15.0%"}
              </span>
              <span className="text-[10px] text-slate-400 block">FY24 Return Profile</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] block">
                <FinancialTooltip term="cfo_pat">CFO / PAT CONVERSION</FinancialTooltip>
              </span>
              <span className={`font-bold text-sm ${isAbc ? "text-red-400" : "text-emerald-400"}`}>
                {isAbc ? "-0.26x (Cash Drag)" : isZenith ? "1.12x (Strong)" : "0.92x (Healthy)"}
              </span>
              <span className="text-[10px] text-slate-400 block">Quality of Earnings</span>
            </div>
          </div>
        </div>

        {/* 4. OBJECTS OF THE ISSUE & PROCEEDS DEPLOYMENT */}
        <div className="rounded-2xl border border-slate-800 bg-[#0f172a] p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-slate-200 font-mono uppercase tracking-wider flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-400" />
              Objects of the Issue (Use of Fresh Proceeds)
            </h3>
            <span className="text-xs font-mono text-emerald-400">
              Fresh Capital: ₹{isAbc ? "800.0" : isZenith ? "600.0" : "1400.0"} Cr
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-emerald-400 font-semibold">1. Manufacturing Expansion</span>
                <span className="font-bold text-white">{isAbc ? "₹420.0 Cr" : isZenith ? "₹320.0 Cr" : "₹850.0 Cr"}</span>
              </div>
              <p className="text-slate-400 font-sans text-[11px] leading-relaxed">
                {isAbc
                  ? "Setting up of a dedicated automated clean-tech heat exchanger and industrial turbine facility at Sanand, Gujarat to double production capacity."
                  : isZenith
                  ? "Scaling cloud infrastructure compute capacity and global GPU cluster access across US and European enterprise regions."
                  : "Procurement of specialized high-voltage testing equipment and substation mobile construction fleets."}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-blue-400 font-semibold">2. Debt Repayment</span>
                <span className="font-bold text-white">{isAbc ? "₹250.0 Cr" : isZenith ? "₹15.0 Cr" : "₹350.0 Cr"}</span>
              </div>
              <p className="text-slate-400 font-sans text-[11px] leading-relaxed">
                {isAbc
                  ? "Prepayment/repayment of high-cost working capital bank borrowings, reducing annual interest burden by ~₹28.5 Crores."
                  : isZenith
                  ? "Full retirement of lingering working capital term debt, leaving the balance sheet completely zero-debt."
                  : "Reduction of outstanding project financing lines to improve debt service coverage ratio."}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-purple-400 font-semibold">3. General Corporate Purposes</span>
                <span className="font-bold text-white">{isAbc ? "₹130.0 Cr" : isZenith ? "₹265.0 Cr" : "₹200.0 Cr"}</span>
              </div>
              <p className="text-slate-400 font-sans text-[11px] leading-relaxed">
                Working capital support, regulatory compliance reserves, and strategic R&D initiatives for next-generation technology developments.
              </p>
            </div>
          </div>
        </div>

        {/* 5. STRENGTHS VS RED FLAGS COMPARISON */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strengths */}
          <div className="rounded-2xl border border-emerald-950 bg-emerald-950/10 p-6 space-y-3">
            <h3 className="text-sm font-semibold text-emerald-400 font-mono uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Core Investment Strengths
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-300 font-sans">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span>
                  <strong>High Top-Line Expansion:</strong> Revenue CAGR of +39.8% across FY22 to FY24 with confirmed order backlog exceeding ₹850 Crores.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span>
                  <strong>Valuation Discount:</strong> Offered at 32.4x P/E, a ~20.4% valuation discount to sector median (40.7x), leaving margin of safety.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span>
                  <strong>Balance Sheet Deleveraging:</strong> Fresh proceeds will retire ₹250 Cr of high-interest debt, expanding post-issue net margins.
                </span>
              </li>
            </ul>
          </div>

          {/* Risks & Red Flags */}
          <div className="rounded-2xl border border-amber-950 bg-amber-950/10 p-6 space-y-3">
            <h3 className="text-sm font-semibold text-amber-400 font-mono uppercase tracking-wider flex items-center gap-2">
              <AlertOctagon className="h-4 w-4" /> Material Risk Disclosures (DRHP)
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-300 font-sans">
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">⚠</span>
                <span>
                  <strong>Cash Flow Divergence:</strong> FY24 operating cash flow was negative (-₹25.4 Cr) despite reporting ₹95.1 Cr PAT due to customer receivables doubling to 118 days.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">⚠</span>
                <span>
                  <strong>Customer Concentration:</strong> Top 3 industrial and defense clients represent 68.42% of revenue without long-term volume guarantees.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">⚠</span>
                <span>
                  <strong>Contingent Liabilities:</strong> Pending ITAT direct tax litigation of ₹14.20 Crores under dispute with appellate authorities.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* BOTTOM ACTION BANNER */}
        <div className="p-8 rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 flex flex-wrap items-center justify-between gap-6 shadow-2xl">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white font-mono">
              Have deeper questions about {companyName}?
            </h3>
            <p className="text-xs text-slate-400 max-w-xl font-sans">
              Our AI Copilot cross-checks statutory SEBI filings against broker reports with zero hallucinations. Ask about valuation multiples, client contracts, or audit notes.
            </p>
          </div>

          <Link
            href={`/assistant?ipo=${ipoId}`}
            className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold shadow-lg shadow-emerald-950/60 transition flex items-center gap-2"
          >
            <Bot className="h-4 w-4" />
            <span>Launch AI Assistant on {symbol}</span>
          </Link>
        </div>
      </main>

      {/* Primary Source Passage Viewer Modal */}
      <PassageViewerModal
        citation={activeCitation}
        isOpen={isCitationModalOpen}
        onClose={() => setIsCitationModalOpen(false)}
      />
    </div>
  );
}
