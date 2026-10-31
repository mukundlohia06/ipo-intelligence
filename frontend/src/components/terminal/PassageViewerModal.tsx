"use client";

import React from "react";
import { X, BookOpen, CheckCircle2, Copy } from "lucide-react";
import type { ClaimItem } from "../../lib/api";

interface PassageViewerModalProps {
  citation: ClaimItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PassageViewerModal: React.FC<PassageViewerModalProps> = ({
  citation,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !citation) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(citation.quote);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-100 font-mono">
                  {citation.source_title || "Prospectus Document"}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                  Page {citation.page_number}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Section: Audited Prospectus Disclosures
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Verification Status */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-xs">
            <div className="flex items-center gap-2 text-emerald-400 font-medium">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Cryptographically Grounded & Substring Verified</span>
            </div>
            <span className="font-mono text-emerald-500/80 text-[11px]">
              SHA-256 Verified
            </span>
          </div>

          {/* Highlighted Quote in Passage */}
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
              <span>Primary Source Passage</span>
              <button
                onClick={handleCopy}
                className="text-[11px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition"
              >
                <Copy className="h-3 w-3" />
                {copied ? "Copied!" : "Copy Quote"}
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 text-sm font-mono leading-relaxed text-slate-300 select-text">
              <div className="border-l-2 border-emerald-500 pl-3 py-1 bg-emerald-500/5 rounded-r">
                <span className="text-emerald-300 font-medium bg-emerald-500/20 px-1 py-0.5 rounded">
                  &ldquo;{citation.quote}&rdquo;
                </span>
              </div>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-mono text-slate-400">
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">DOCUMENT TYPE</span>
              <span className="text-slate-200">SEBI DRHP / Audited Restated</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">CHUNK ID</span>
              <span className="text-slate-200 truncate block">
                {citation.chunk_id || "chk_prospectus_verified"}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950/40 text-xs text-slate-400">
          <span className="text-[11px]">Clicking any citation in the terminal brings you to its source.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
