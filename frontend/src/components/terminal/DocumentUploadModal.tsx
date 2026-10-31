"use client";

import React, { useState } from "react";
import { X, UploadCloud, CheckCircle2, AlertCircle, FileText, Loader2 } from "lucide-react";
import { uploadDocumentFile } from "../../lib/api";

interface DocumentUploadModalProps {
  ipoId: string;
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess?: () => void;
}

type Stage = "idle" | "uploading" | "parsing" | "chunking" | "indexing" | "complete" | "error";

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  ipoId,
  isOpen,
  onClose,
  onUploadSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<string>("prospectus");
  const [stage, setStage] = useState<Stage>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [chunksCount, setChunksCount] = useState<number>(0);
  const [uploadedSourceId, setUploadedSourceId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setErrorMessage(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setStage("uploading");
      setTimeout(() => setStage("parsing"), 600);
      setTimeout(() => setStage("chunking"), 1200);

      const res = await uploadDocumentFile(file, ipoId, docType);
      setChunksCount(res.chunks_count || res.chunks_created || 0);
      setUploadedSourceId(res.source_id);
      setStage("complete");
      if (onUploadSuccess) onUploadSuccess();
    } catch (err: any) {
      setStage("error");
      setErrorMessage(err.message || "Failed to process document upload.");
    }
  };

  const resetForm = () => {
    setFile(null);
    setStage("idle");
    setErrorMessage(null);
    setChunksCount(0);
    setUploadedSourceId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <UploadCloud className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100 font-mono">
                Ingest Research Filing (PyMuPDF)
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Target IPO: <span className="text-emerald-400">{ipoId}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {stage === "idle" && (
            <>
              {/* Doc Type Selector */}
              <div>
                <label className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-1.5">
                  Filing Category
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="prospectus">Draft Red Herring Prospectus (DRHP / RHP)</option>
                  <option value="financial_statement">Restated Financial Statements</option>
                  <option value="brokerage_note">Institutional Brokerage Note / Valuation Model</option>
                  <option value="anchor_allotment">Anchor Investor Allocation Sheet</option>
                </select>
              </div>

              {/* Drag & Drop Area */}
              <div className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-xl p-8 text-center bg-slate-950/40 transition">
                <input
                  type="file"
                  id="doc-upload"
                  accept=".pdf,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="doc-upload" className="cursor-pointer block">
                  <FileText className="h-10 w-10 text-slate-500 mx-auto mb-2" />
                  <p className="text-xs font-mono text-slate-200 font-medium">
                    {file ? file.name : "Click to browse or drop PDF / text filing"}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Supports PyMuPDF text & table extraction with page anchoring
                  </p>
                </label>
              </div>

              {file && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-950/20 border border-blue-500/20 text-xs font-mono">
                  <span className="text-blue-300 truncate max-w-xs">{file.name}</span>
                  <span className="text-slate-400">{(file.size / 1024).toFixed(1)} KB</span>
                </div>
              )}
            </>
          )}

          {/* Progress / Pipeline Stages */}
          {stage !== "idle" && stage !== "error" && stage !== "complete" && (
            <div className="py-6 space-y-4">
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
              </div>
              <div className="space-y-2">
                {[
                  { key: "uploading", label: "1. Uploading file to ingestion server" },
                  { key: "parsing", label: "2. PyMuPDF structure-aware PDF parsing & page numbering" },
                  { key: "chunking", label: "3. Semantic chunking (500-1000 tokens) with section headers" },
                  { key: "indexing", label: "4. Dense vector embedding & MongoDB Atlas Search indexing" },
                ].map((s) => (
                  <div
                    key={s.key}
                    className={`flex items-center gap-2 text-xs font-mono p-2 rounded-lg ${
                      stage === s.key
                        ? "bg-blue-950/50 text-blue-300 border border-blue-500/30"
                        : "text-slate-500"
                    }`}
                  >
                    <div
                      className={`h-2 w-2 rounded-full ${
                        stage === s.key ? "bg-blue-400 animate-ping" : "bg-slate-700"
                      }`}
                    />
                    <span>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Success State */}
          {stage === "complete" && (
            <div className="py-4 text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-semibold text-slate-100 font-mono">
                Document Ingestion Complete!
              </h4>
              <p className="text-xs text-slate-400 font-mono">
                Extracted and indexed <span className="text-emerald-400 font-bold">{chunksCount} searchable chunks</span> into MongoDB Atlas.
              </p>
            </div>
          )}

          {/* Error State */}
          {stage === "error" && (
            <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/30 text-xs font-mono text-red-300 flex items-start gap-3">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
              <div>
                <span className="font-semibold block">Ingestion Failed</span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-slate-800 bg-slate-950/40 text-xs">
          {stage === "idle" ? (
            <>
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg text-slate-400 hover:text-white font-mono transition"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!file}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-mono font-medium transition"
              >
                Start Ingestion
              </button>
            </>
          ) : stage === "complete" ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs transition"
              >
                Close
              </button>
              {uploadedSourceId && (
                <a
                  href={`/assistant?ipo=${ipoId}&doc=${uploadedSourceId}`}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <span>Ask AI About This Document</span>
                </a>
              )}
            </div>
          ) : stage === "error" ? (
            <button
              onClick={resetForm}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs transition"
            >
              Try Again
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};
