"use client";

import React, { useState } from "react";
import {
  Send,
  Sparkles,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";
import type { ResearchResponse, ClaimItem, ConflictItem } from "../../lib/api";

interface ResearchConsoleProps {
  ipoId: string;
  onQuerySubmit: (question: string) => Promise<void>;
  loading: boolean;
  queryResult: ResearchResponse | null;
  onCitationClick: (citation: ClaimItem) => void;
}

export const ResearchConsole: React.FC<ResearchConsoleProps> = ({
  ipoId,
  onQuerySubmit,
  loading,
  queryResult,
  onCitationClick,
}) => {
  const [inputQuestion, setInputQuestion] = useState("");

  const quickPrompts = [
    {
      label: "Objects of Issue",
      query: "What are the primary objects of the issue and how will the ₹400 Cr fresh issue be utilized?",
    },
    {
      label: "Cash Flow Audit",
      query: "What is the FY24 restated cash flow from operating activities and why is it divergent from PAT?",
    },
    {
      label: "Contradiction Check",
      query: "What did Apex Capital report regarding FY24 CFO compared to the audited DRHP prospectus?",
    },
    {
      label: "Sufficiency Stress Test",
      query: "Will ABC Industries announce an acquisition of a US aerospace defense supplier in Q4 2027?",
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuestion.trim() || loading) return;
    onQuerySubmit(inputQuestion.trim());
  };

  const handleSelectQuickPrompt = (q: string) => {
    setInputQuestion(q);
    onQuerySubmit(q);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ANSWERED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            ANSWERED & VERIFIED
          </span>
        );
      case "CONFLICTING":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            CONTRADICTION DETECTED
          </span>
        );
      case "INSUFFICIENT":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-slate-500/10 border border-slate-500/30 text-slate-300">
            <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
            SUFFICIENCY GATE: UNANSWERABLE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-blue-500/10 border border-blue-500/30 text-blue-400">
            {status}
          </span>
        );
    }
  };

  const totalTime = queryResult?.latency_ms?.total || 0;

  return (
    <div className="flex flex-col h-full rounded-xl border border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur overflow-hidden">
      {/* Console Header */}
      <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-emerald-400" />
          <h2 className="text-sm font-semibold tracking-wider uppercase text-slate-200 font-mono">
            Evidence-First Research Terminal
          </h2>
        </div>
        {queryResult && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
              <Clock className="h-3 w-3" />
              <span>{totalTime.toFixed(1)} ms</span>
            </div>
            {getStatusBadge(queryResult.state)}
          </div>
        )}
      </div>

      {/* Query Bar */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-950/40">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            placeholder="Ask anything grounded in DRHP, Financials, or Brokerage filings..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition shadow-inner"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !inputQuestion.trim()}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-mono font-semibold flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition cursor-pointer"
          >
            {loading ? (
              <>
                <span className="h-3.5 w-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                <span>Reranking...</span>
              </>
            ) : (
              <>
                <span>Run Query</span>
                <Send className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Quick query chips */}
        <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mr-1 shrink-0">
            Suggested:
          </span>
          {quickPrompts.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectQuickPrompt(item.query)}
              className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-800/70 hover:bg-slate-700/80 border border-slate-700/60 text-[11px] font-mono text-slate-300 hover:text-white transition"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Results Body */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4">
        {!queryResult && !loading && (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50 text-slate-400">
              <Sparkles className="h-8 w-8 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-200 font-mono">
                Ask a Grounded Research Question
              </h3>
              <p className="text-xs text-slate-400 font-mono max-w-md mt-1">
                Every claim is verified against official DRHP pages via MongoDB Hybrid Search (Vector + BM25) with zero hallucination.
              </p>
            </div>
          </div>
        )}

        {loading && (
          <div className="space-y-4 py-8">
            <div className="flex items-center justify-center gap-3">
              <span className="h-3 w-3 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-mono text-slate-300">
                Executing MongoDB Atlas Vector Search + BM25 Lexical Hybrid Fusion...
              </span>
            </div>
            <div className="space-y-2 max-w-lg mx-auto">
              <div className="h-4 bg-slate-800/60 rounded animate-pulse w-full" />
              <div className="h-4 bg-slate-800/60 rounded animate-pulse w-5/6" />
              <div className="h-4 bg-slate-800/60 rounded animate-pulse w-4/6" />
            </div>
          </div>
        )}

        {queryResult && (
          <div className="space-y-4">
            {/* Contradiction Radar Card */}
            {queryResult.conflicts && queryResult.conflicts.length > 0 && (
              <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-semibold">
                    <AlertTriangle className="h-4 w-4" />
                    <span>CONTRADICTION DETECTED BETWEEN SOURCES</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 border border-amber-500/30 text-amber-300">
                    High Divergence
                  </span>
                </div>

                {queryResult.conflicts.map((conflict: ConflictItem, cIdx: number) => (
                  <div key={cIdx} className="space-y-2">
                    <p className="text-xs text-amber-200/90 font-mono font-semibold">
                      Topic: {conflict.topic}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono space-y-1">
                        <span className="text-slate-400 text-[10px] uppercase block font-semibold">
                          Source A: {conflict.source_a_title}
                        </span>
                        <p className="text-slate-200">
                          &ldquo;{conflict.source_a_statement}&rdquo;
                        </p>
                      </div>

                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono space-y-1">
                        <span className="text-slate-400 text-[10px] uppercase block font-semibold">
                          Source B: {conflict.source_b_title}
                        </span>
                        <p className="text-slate-200">
                          &ldquo;{conflict.source_b_statement}&rdquo;
                        </p>
                      </div>
                    </div>

                    {conflict.notes && (
                      <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs font-mono text-amber-300">
                        <span className="font-semibold text-amber-200">Resolution Note: </span>
                        {conflict.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Sufficiency Warning Card */}
            {queryResult.state === "INSUFFICIENT" && (
              <div className="rounded-xl border border-slate-700 bg-slate-950/90 p-4 space-y-2">
                <div className="flex items-center gap-2 text-slate-300 font-mono text-xs font-semibold">
                  <ShieldAlert className="h-4 w-4 text-amber-400" />
                  <span>Zero-Hallucination Sufficiency Gate Intercept</span>
                </div>
                <p className="text-xs text-slate-400 font-mono leading-relaxed">
                  The query asks for forward-looking speculation or unverified claims not disclosed in the official SEBI DRHP filing. In accordance with NEXUS Track 2 strict evidence-first guidelines, this terminal will not fabricate forward estimates.
                </p>
                {queryResult.gaps && queryResult.gaps.length > 0 && (
                  <div className="pt-1">
                    <span className="text-[10px] text-slate-500 uppercase block font-mono">Missing Disclosures:</span>
                    <ul className="text-xs font-mono text-slate-400 list-disc list-inside">
                      {queryResult.gaps.map((gap: string, gIdx: number) => (
                        <li key={gIdx}>{gap}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Synthesized Answer */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800/80 pb-2">
                <span className="uppercase tracking-wider">Synthesized Evidence Answer</span>
                <span className="text-emerald-400">
                  {queryResult.claims ? queryResult.claims.length : 0} Verified Claim{(queryResult.claims?.length ?? 0) === 1 ? "" : "s"}
                </span>
              </div>

              <div className="text-sm font-sans text-slate-200 leading-relaxed space-y-2 select-text">
                {queryResult.claims && queryResult.claims.length > 0 ? (
                  queryResult.claims.map((claim: ClaimItem, idx: number) => (
                    <p key={idx} className="inline leading-relaxed">
                      {claim.text}{" "}
                      <button
                        onClick={() => onCitationClick(claim)}
                        className="inline-flex items-center px-1.5 py-0.2 mx-0.5 rounded text-[11px] font-mono font-medium bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 cursor-pointer transition"
                        title={`Page ${claim.page_number}: "${claim.quote}"`}
                      >
                        [{idx + 1}]
                      </button>{" "}
                    </p>
                  ))
                ) : (
                  <p className="text-slate-300">{queryResult.summary}</p>
                )}
              </div>
            </div>

            {/* Quick Citations strip */}
            {queryResult.claims && queryResult.claims.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Cited Grounding Sources</span>
                  <span className="text-slate-500">Click to view in primary document</span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {queryResult.claims.map((cite: ClaimItem, i: number) => (
                    <div
                      key={i}
                      onClick={() => onCitationClick(cite)}
                      className="p-3 rounded-lg border border-slate-800/80 hover:border-emerald-500/40 bg-slate-950/40 hover:bg-slate-900/60 transition cursor-pointer flex items-start justify-between gap-3 text-xs font-mono group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                            Page {cite.page_number}
                          </span>
                          <span className="font-semibold text-slate-200 group-hover:text-emerald-300 transition">
                            {cite.source_title}
                          </span>
                        </div>
                        <p className="text-slate-400 line-clamp-2 text-[11px]">
                          &ldquo;{cite.quote}&rdquo;
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-emerald-400 shrink-0 mt-1 transition" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
