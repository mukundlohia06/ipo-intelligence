"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Search,
  UploadCloud,
  CheckCircle2,
  ExternalLink,
  Layers,
  Sparkles,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  FileCheck,
  Trash2
} from "lucide-react";
import { Navbar } from "../../components/navigation/Navbar";
import { DocumentUploadModal } from "../../components/terminal/DocumentUploadModal";
import { PassageViewerModal } from "../../components/terminal/PassageViewerModal";
import { fetchDocuments, fetchIpos, searchDocumentChunks, deleteDocument, DocumentItem, IpoSummary } from "../../lib/api";

export default function DocumentsPage() {
  const [selectedIpo, setSelectedIpo] = useState<string>("ipo_hyundai_motor_india");
  const [ipoList, setIpoList] = useState<IpoSummary[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState<boolean>(false);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);

  // Passage viewer modal
  const [selectedPassage, setSelectedPassage] = useState<{
    text: string;
    source_title: string;
    page_number: number;
    chunk_id: string;
    quote: string;
    verified: boolean;
  } | null>(null);

  useEffect(() => {
    fetchIpos().then((list) => {
      setIpoList(list);
      if (list.length > 0 && !selectedIpo) {
        setSelectedIpo(list[0].id);
      }
    });
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const docs = await fetchDocuments(selectedIpo);
      setDocuments(docs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [selectedIpo]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await searchDocumentChunks(searchQuery.trim(), selectedIpo);
      setSearchResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060911] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/20">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Evidence Engine
              </span>
              <span className="text-xs text-slate-400">Atlas Vector & Full-Text Search</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Document Intelligence Repository
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Inspect original DRHP/RHP filings, CRISIL industry reports, and SEBI compliance records. Every passage is parsed with PyMuPDF, embedded via MongoDB Atlas, and substring-verified.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all shadow-lg shadow-emerald-950/40"
            >
              <UploadCloud className="w-4 h-4" />
              Upload Filing
            </button>
            <Link
              href="/assistant"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold border border-slate-700 transition-all"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Ask AI Copilot
            </Link>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Company Filing:
            </label>
            <select
              value={selectedIpo}
              onChange={(e) => {
                setSelectedIpo(e.target.value);
                setSearchResults([]);
              }}
              className="bg-slate-950 border border-slate-700 text-sm text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500 font-mono"
            >
              {ipoList.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.company_name} ({opt.symbol})
                </option>
              ))}
            </select>
          </div>

          <form onSubmit={handleSearch} className="flex-1 max-w-md flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search raw passages (e.g. Sanand, litigation, EBITDA)..."
                className="w-full bg-slate-950 border border-slate-700 text-sm text-white pl-9 pr-3 py-1.5 rounded-lg focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              disabled={searching}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
            >
              {searching ? "Searching..." : "Search"}
            </button>
          </form>
        </div>

        {/* Search Results (if query executed) */}
        {searchResults.length > 0 && (
          <div className="bg-slate-900/80 border border-emerald-500/30 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                <Search className="w-4 h-4" />
                Matching Filings Passages ({searchResults.length} found)
              </h2>
              <button
                onClick={() => setSearchResults([])}
                className="text-xs text-slate-400 hover:text-slate-200 underline"
              >
                Clear Search
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {searchResults.map((chk, idx) => (
                <div
                  key={chk.id || idx}
                  className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 hover:border-slate-700 transition text-xs space-y-2"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800/80 pb-1.5">
                    <span className="font-medium text-slate-300 truncate max-w-[200px]">
                      {chk.section_title || "Filing Extract"}
                    </span>
                    <span className="bg-slate-800 px-2 py-0.5 rounded text-emerald-400 font-mono">
                      Page {chk.page_number}
                    </span>
                  </div>
                  <p className="text-slate-300 leading-relaxed line-clamp-3 font-serif">
                    &ldquo;{chk.text}&rdquo;
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() =>
                        setSelectedPassage({
                          text: chk.text,
                          source_title: chk.section_title || "Filing Section",
                          page_number: chk.page_number || 1,
                          chunk_id: chk.id || "chunk_ref",
                          quote: chk.text,
                          verified: true,
                        })
                      }
                      className="text-emerald-400 hover:underline inline-flex items-center gap-1 font-semibold"
                    >
                      Inspect Full Passage <ArrowRight className="w-3 h-3" />
                    </button>
                    <Link
                      href={`/assistant?ipo=${selectedIpo}&q=${encodeURIComponent(
                        `Explain what the filing says regarding: "${chk.text.slice(0, 80)}..."`
                      )}`}
                      className="text-slate-400 hover:text-white inline-flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-emerald-400" /> Ask AI
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Documents Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              Indexed Documents ({documents.length})
            </h2>
            <span className="text-xs text-slate-400">
              Deterministic Chunking with Token Length &amp; Overlap
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800 animate-pulse">
              Loading document index from MongoDB Atlas...
            </div>
          ) : documents.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/40 rounded-xl border border-slate-800">
              <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-200">No documents indexed for this company</p>
              <p className="text-xs text-slate-400 mt-1">
                Upload a DRHP, RHP, or annual report to generate vectors and run AI inquiries.
              </p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
              >
                <UploadCloud className="w-3.5 h-3.5" /> Upload Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-slate-900/80 border border-slate-800/90 rounded-xl p-5 hover:border-slate-700 transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                        {doc.doc_type}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> Searchable
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white line-clamp-2">{doc.title}</h3>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/60 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase">Pages</span>
                        <span className="font-semibold text-slate-200">{doc.pages} Pages</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase">Indexed Chunks</span>
                        <span className="font-semibold text-emerald-400">{doc.chunks_count} Chunks</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setSearchQuery(doc.title.split(" ")[0]);
                        searchDocumentChunks(doc.title.split(" ")[0], selectedIpo).then((res) =>
                          setSearchResults(res)
                        );
                      }}
                      className="text-xs text-slate-300 hover:text-white font-medium flex items-center gap-1"
                    >
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      Browse Chunks
                    </button>

                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/assistant?ipo=${selectedIpo}&doc=${doc.id}`}
                        className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-500/30"
                      >
                        <Sparkles className="w-3 h-3" />
                        Ask AI
                      </Link>

                      <button
                        onClick={async () => {
                          if (confirm(`Delete document "${doc.title}" and its indexed chunks?`)) {
                            await deleteDocument(doc.id);
                            loadDocuments();
                          }
                        }}
                        className="text-xs text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Verification Architecture Banner */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row items-center gap-6">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 flex-shrink-0">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white">
              Zero-Hallucination Substring Quote Verification
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every citation generated by the IPO Intelligence RAG engine is cryptographically verified against the indexed filing chunks. If an LLM fabricates or alters a single word in a cited quote, the system marks it as unverified and displays an explicit discrepancy badge.
            </p>
          </div>
        </div>
      </main>

      {/* Upload Modal */}
      <DocumentUploadModal
        isOpen={showUploadModal}
        ipoId={selectedIpo}
        onClose={() => setShowUploadModal(false)}
        onUploadSuccess={() => {
          loadDocuments();
          setShowUploadModal(false);
        }}
      />

      {/* Passage Viewer Modal */}
      {selectedPassage && (
        <PassageViewerModal
          isOpen={true}
          onClose={() => setSelectedPassage(null)}
          citation={selectedPassage}
        />
      )}
    </div>
  );
}
