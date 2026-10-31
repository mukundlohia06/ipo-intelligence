"use client";

import React, { useState } from "react";
import {
  FileSearch,
  ChevronDown,
  ChevronUp,
  AlertOctagon,
  TrendingUp,
  BookOpen,
  Database,
} from "lucide-react";
import type { IpoSummary, ResearchResponse, ClaimItem, TraceItem } from "../../lib/api";

interface EvidencePanelProps {
  ipo?: IpoSummary | null;
  queryResult?: ResearchResponse | null;
  onCitationClick: (citation: ClaimItem) => void;
  onOpenUpload: () => void;
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({
  ipo,
  queryResult,
  onCitationClick,
  onOpenUpload,
}) => {
  const [showXRay, setShowXRay] = useState(false);

  return (
    <div className="flex flex-col h-full rounded-xl border border-slate-800 bg-slate-900/90 shadow-2xl backdrop-blur overflow-hidden">
      {/* Panel Header */}
      <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileSearch className="h-4 w-4 text-blue-400" />
          <h2 className="text-sm font-semibold tracking-wider uppercase text-slate-200 font-mono">
            Evidence & Document Hub
          </h2>
        </div>
        <button
          onClick={onOpenUpload}
          className="px-2.5 py-1 rounded-md text-[11px] font-mono font-medium bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 transition flex items-center gap-1.5"
        >
          <span>Ingest PDF</span>
        </button>
      </div>

      <div className="flex-1 p-5 overflow-y-auto space-y-4">
        {/* 1-Minute Executive Assessment (Terminal Style) */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
              1-Minute Executive Assessment
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/50 border border-emerald-500/30 text-emerald-300">
              Score: 74/100
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
              <span className="text-slate-500 text-[10px] block">TOTAL ISSUE SIZE</span>
              <span className="text-slate-100 font-semibold">₹500.0 Cr</span>
            </div>
            <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
              <span className="text-slate-500 text-[10px] block">FRESH / OFS SPLIT</span>
              <span className="text-slate-100 font-semibold">80% / 20%</span>
            </div>
            <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
              <span className="text-slate-500 text-[10px] block">PRICE BAND</span>
              <span className="text-slate-100 font-semibold">₹380 – ₹400</span>
            </div>
            <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
              <span className="text-slate-500 text-[10px] block">VALUATION P/E</span>
              <span className="text-emerald-400 font-semibold">32.4x (20% Disc)</span>
            </div>
          </div>

          {/* Key Positives */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Core Investment Strengths
            </span>
            <ul className="text-xs font-mono text-slate-300 space-y-1">
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-400">✓</span>
                <span>Revenue CAGR +39.8% (FY22-24) backed by ₹850 Cr confirmed order book</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-400">✓</span>
                <span>Offered at ~20.4% valuation discount to peer median (40.7x)</span>
              </li>
            </ul>
          </div>

          {/* Key Risks */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1">
              <AlertOctagon className="h-3 w-3" /> Red Flag Disclosures
            </span>
            <ul className="text-xs font-mono text-slate-300 space-y-1">
              <li className="flex items-start gap-1.5">
                <span className="text-amber-400">⚠</span>
                <span>FY24 Operating Cash Flow is negative (-₹25.4 Cr) vs PAT (+₹95.1 Cr)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-amber-400">⚠</span>
                <span>Top 3 defense clients account for 64.2% of FY24 gross revenues</span>
              </li>
            </ul>
          </div>
        </div>

        {/* MongoDB Atlas Retrieval X-Ray Inspector */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
          <button
            onClick={() => setShowXRay(!showXRay)}
            className="w-full px-4 py-3 flex items-center justify-between text-xs font-mono text-slate-200 hover:bg-slate-900/50 transition"
          >
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-400" />
              <span className="font-semibold uppercase tracking-wider">
                MongoDB Atlas Retrieval X-Ray
              </span>
            </div>
            {showXRay ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {showXRay && (
            <div className="p-4 border-t border-slate-800 bg-slate-950 space-y-3 font-mono text-xs">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                  Hybrid Fusion Pipeline (RRF k=60)
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                  <div>
                    <span className="text-slate-500">Vector Index:</span>{" "}
                    <span className="text-emerald-400">chunks_vector (768d)</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Lexical Index:</span>{" "}
                    <span className="text-blue-400">chunks_text (BM25)</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Pre-Filter:</span>{" "}
                    <span className="text-slate-200">ipo_id pushdown</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Embed Cache:</span>{" "}
                    <span className="text-emerald-400">SHA-256 Hit</span>
                  </div>
                </div>
              </div>

              {queryResult?.trace && queryResult.trace.length > 0 ? (
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                    Top Retrieved Chunks by RRF Rank:
                  </span>
                  {queryResult.trace.slice(0, 3).map((chunk: TraceItem, idx: number) => (
                    <div
                      key={idx}
                      className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px] space-y-1"
                    >
                      <div className="flex items-center justify-between text-slate-300 font-semibold">
                        <span>Chunk #{idx + 1} ({chunk.chunk_id.slice(0, 16)}...)</span>
                        <span className="text-emerald-400">RRF: {chunk.rrf_score.toFixed(4)}</span>
                      </div>
                      <div className="text-slate-400 text-[10px] flex items-center gap-2">
                        <span>Page {chunk.page_number}</span>
                        <span>•</span>
                        <span>{chunk.section_title || "General"}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 flex gap-2">
                        <span>Vector Rank: {chunk.vector_rank ?? "N/A"}</span>
                        <span>Lexical Rank: {chunk.lexical_rank ?? "N/A"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-[11px]">
                  Execute a research query in the console to inspect raw MongoDB vector and BM25 scores.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Ingested Documents List */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-blue-400" />
              Indexed Source Corpus
            </span>
            <span className="text-[10px] font-mono text-slate-500">3 Filings Loaded</span>
          </div>

          <div className="space-y-2 font-mono text-xs">
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-200 block">SEBI Draft Red Herring Prospectus</span>
                <span className="text-[10px] text-slate-400">Official filing • 4 Pages • 4 Chunks</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                Primary
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-200 block">Audited Restated Financials</span>
                <span className="text-[10px] text-slate-400">Statutory Auditor • 3 Pages • 3 Chunks</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                Audited
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-200 block">Apex Capital Institutional Note</span>
                <span className="text-[10px] text-slate-400">Brokerage Note • 2 Pages • 2 Chunks</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] bg-amber-950 text-amber-400 border border-amber-500/30">
                Conflict Check
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
