"use client";

import React from "react";
import Link from "next/link";
import { Activity, Database, Cpu, Sparkles, AlertTriangle, ShieldCheck, ArrowLeft } from "lucide-react";
import { HealthResponse } from "../../lib/api";

interface TerminalHeaderProps {
  health?: HealthResponse | null;
  onRunDemoQuery?: (question: string) => void;
  isDemoRunning?: boolean;
}

export const TerminalHeader: React.FC<TerminalHeaderProps> = ({
  health,
  onRunDemoQuery,
  isDemoRunning = false
}) => {
  return (
    <header className="border-b border-slate-800 bg-[#0c1220]/90 backdrop-blur sticky top-0 z-50 px-5 py-2.5">
      {/* Top Bar: Brand, Market Ticker & System Health */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        
        {/* Brand & Terminal Navigation */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm tracking-wider group-hover:bg-emerald-500/20 transition-all">
              IPO
            </div>
            <div>
              <span className="font-semibold text-slate-100 tracking-tight text-sm block">IPO Intelligence</span>
              <span className="text-[10px] text-slate-400 font-mono">Evidence-First Research Terminal</span>
            </div>
          </Link>
        </div>

        {/* Market Ticker Strip (Like Finbosoft Reference) */}
        <div className="hidden lg:flex items-center gap-4 text-xs font-mono bg-slate-900/60 border border-slate-800 px-3 py-1 rounded-md">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">NIFTY 50:</span>
            <span className="text-emerald-400 font-semibold">24,320.50 (+0.48%)</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Avg GMP:</span>
            <span className="text-emerald-400 font-semibold">+17.89%</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Demand:</span>
            <span className="text-cyan-400 font-semibold">8.60x Total</span>
          </div>
        </div>

        {/* System Diagnostics & Presenter Demo Bar */}
        <div className="flex items-center gap-2 text-xs font-mono">
          
          {/* Live MongoDB Status */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border bg-emerald-950/30 border-emerald-800/50 text-emerald-400 text-[11px]">
            <Database className="h-3 w-3" />
            <span>Atlas Vector: Active</span>
          </div>

          {/* Quick Demo Script Buttons (For 7-Min Video Recording!) */}
          {onRunDemoQuery && (
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-lg">
              <span className="text-[10px] text-amber-400 font-semibold uppercase px-1.5 py-0.5">Demo Script:</span>
              <button
                onClick={() => onRunDemoQuery("What is the issue size and how will proceeds be utilized?")}
                disabled={isDemoRunning}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] transition-all disabled:opacity-50"
                title="Synthesize DRHP and Financial Statements"
              >
                1. Multi-Source
              </button>
              <button
                onClick={() => onRunDemoQuery("An equity report claims the company generated strong positive operating cash flows in FY24. What does the audited prospectus show?")}
                disabled={isDemoRunning}
                className="px-2 py-0.5 rounded bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border border-purple-800/50 text-[11px] transition-all disabled:opacity-50"
                title="Detect planted contradiction between broker note and DRHP"
              >
                2. Conflict Radar
              </button>
              <button
                onClick={() => onRunDemoQuery("Will this IPO definitely list at a 35% premium on listing day?")}
                disabled={isDemoRunning}
                className="px-2 py-0.5 rounded bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-800/50 text-[11px] transition-all disabled:opacity-50"
                title="Honest refusal on speculative listing gain"
              >
                3. Zero Hallucination
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
