"use client";

import React, { useState } from "react";
import { ShieldCheck, TrendingUp, AlertTriangle, Scale, Target } from "lucide-react";
import { ScorecardResponse } from "../../lib/api";

interface ScorecardCardProps {
  scoreData?: ScorecardResponse | null;
}

export const ScorecardCard: React.FC<ScorecardCardProps> = ({ scoreData }) => {
  const [activeHorizon, setActiveHorizon] = useState<"long_term" | "listing_gains" | "capital_protection">("long_term");

  const scorecard = scoreData?.scorecard || {
    overall_score: 74,
    verdict: "APPLY (Long-Term Horizon)",
    fundamentals: { score: 24, max: 30 },
    valuation: { score: 14, max: 20 },
    risks: { score: 18, max: 25 },
    sentiment: { score: 11, max: 15 },
    listing_potential: { score: 7, max: 10 },
  };

  const horizons = scoreData?.investment_horizons || {
    long_term: {
      verdict: "APPLY",
      confidence: "HIGH",
      thesis: "Rapid 42% revenue CAGR in clean-tech transition with automated capacity expansion at Sanand.",
    },
    listing_gains: {
      verdict: "APPLY FOR LISTING POP",
      confidence: "MODERATE",
      thesis: "Robust subscription demand (8.6x) and GMP (+17.89%) support favorable listing day gains.",
    },
    capital_protection: {
      verdict: "MONITOR CAREFULLY",
      confidence: "CAUTION",
      thesis: "Working capital drag resulting in negative CFO (-₹25.4 Cr) and 68.4% customer concentration warrant monitoring.",
    },
  };

  const horizonDetail = horizons[activeHorizon];

  return (
    <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 space-y-4">
      
      {/* Top Banner: Score Gauge & Verdict */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col items-center justify-center font-mono font-bold text-emerald-400">
            <span className="text-lg leading-none">{scorecard.overall_score}</span>
            <span className="text-[9px] text-emerald-500/70">/100</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono tracking-wider text-slate-400">Deterministic Health Score</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                SOLID FUNDAMENTALS
              </span>
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">{scorecard.verdict}</h3>
          </div>
        </div>

        {/* Investment Horizon Switcher */}
        <div className="flex items-center rounded-lg bg-slate-900 border border-slate-800 p-1 text-xs font-mono">
          <button
            onClick={() => setActiveHorizon("long_term")}
            className={`px-2.5 py-1 rounded transition-all ${
              activeHorizon === "long_term" 
                ? "bg-emerald-500 text-slate-950 font-bold" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Long-Term
          </button>
          <button
            onClick={() => setActiveHorizon("listing_gains")}
            className={`px-2.5 py-1 rounded transition-all ${
              activeHorizon === "listing_gains" 
                ? "bg-cyan-500 text-slate-950 font-bold" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Listing Pop
          </button>
          <button
            onClick={() => setActiveHorizon("capital_protection")}
            className={`px-2.5 py-1 rounded transition-all ${
              activeHorizon === "capital_protection" 
                ? "bg-amber-500 text-slate-950 font-bold" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Capital Protection
          </button>
        </div>
      </div>

      {/* Selected Horizon Assessment Card */}
      <div className="rounded-lg bg-slate-900/50 border border-slate-800/80 p-3 flex items-start gap-3 text-xs">
        <div className="p-1.5 rounded bg-slate-800 text-emerald-400 shrink-0 mt-0.5">
          <Target className="h-4 w-4" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">
              {activeHorizon.replace("_", " ")} Assessment:
            </span>
            <span className="font-mono text-emerald-400 font-bold">{horizonDetail.verdict}</span>
            <span className="text-[10px] text-slate-400">({horizonDetail.confidence} Confidence)</span>
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">{horizonDetail.thesis}</p>
        </div>
      </div>

      {/* 5-Dimension Progress Bars (Finbosoft / Bewertungsübersicht Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1 text-[11px] font-mono">
        
        {/* Fundamentals */}
        <div className="rounded-lg bg-slate-900/40 border border-slate-800 p-2.5 space-y-1.5">
          <div className="flex justify-between text-slate-400">
            <span>Fundamentals (30%)</span>
            <span className="text-emerald-400 font-bold">{scorecard.fundamentals.score}/30</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(scorecard.fundamentals.score / 30) * 100}%` }} />
          </div>
          <span className="text-[10px] text-slate-500 block truncate">+42% YoY Revenue</span>
        </div>

        {/* Valuation */}
        <div className="rounded-lg bg-slate-900/40 border border-slate-800 p-2.5 space-y-1.5">
          <div className="flex justify-between text-slate-400">
            <span>Valuation (20%)</span>
            <span className="text-cyan-400 font-bold">{scorecard.valuation.score}/20</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${(scorecard.valuation.score / 20) * 100}%` }} />
          </div>
          <span className="text-[10px] text-slate-500 block truncate">20.4% Peer Discount</span>
        </div>

        {/* Risks */}
        <div className="rounded-lg bg-slate-900/40 border border-slate-800 p-2.5 space-y-1.5">
          <div className="flex justify-between text-slate-400">
            <span>Risks (25%)</span>
            <span className="text-amber-400 font-bold">{scorecard.risks.score}/25</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${(scorecard.risks.score / 25) * 100}%` }} />
          </div>
          <span className="text-[10px] text-slate-500 block truncate">-₹25.4 Cr CFO Alert</span>
        </div>

        {/* Sentiment */}
        <div className="rounded-lg bg-slate-900/40 border border-slate-800 p-2.5 space-y-1.5">
          <div className="flex justify-between text-slate-400">
            <span>Sentiment (15%)</span>
            <span className="text-purple-400 font-bold">{scorecard.sentiment.score}/15</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-purple-500 h-full rounded-full" style={{ width: `${(scorecard.sentiment.score / 15) * 100}%` }} />
          </div>
          <span className="text-[10px] text-slate-500 block truncate">8.6x Total Demand</span>
        </div>

        {/* Listing Potential */}
        <div className="rounded-lg bg-slate-900/40 border border-slate-800 p-2.5 space-y-1.5">
          <div className="flex justify-between text-slate-400">
            <span>Listing Pop (10%)</span>
            <span className="text-emerald-400 font-bold">{scorecard.listing_potential.score}/10</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${(scorecard.listing_potential.score / 10) * 100}%` }} />
          </div>
          <span className="text-[10px] text-slate-500 block truncate">+17.9% Premium</span>
        </div>

      </div>

    </div>
  );
};
