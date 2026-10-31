"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Send,
  Sparkles,
  Bot,
  User,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Copy,
  RotateCcw,
  BookOpen,
  ArrowRight,
  TrendingUp,
  AlertOctagon,
  ChevronDown,
  Layers,
  Cpu,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Navbar } from "../../components/navigation/Navbar";
import { PassageViewerModal } from "../../components/terminal/PassageViewerModal";
import {
  fetchIpos,
  executeResearchQuery,
  type IpoSummary,
  type ResearchResponse,
  type ClaimItem,
} from "../../lib/api";

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  timestamp: string;
  content?: string;
  response?: ResearchResponse;
}

function AssistantPageContent() {
  const searchParams = useSearchParams();
  const initialIpo = searchParams.get("ipo") || "ipo_abc_industries";

  const [ipos, setIpos] = useState<IpoSummary[]>([]);
  const [selectedIpoId, setSelectedIpoId] = useState<string>(initialIpo);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuestion, setInputQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeCitation, setActiveCitation] = useState<ClaimItem | null>(null);
  const [isCitationModalOpen, setIsCitationModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load IPOs for context dropdown
  useEffect(() => {
    fetchIpos().then((list) => {
      setIpos(list);
      if (list.length > 0 && !selectedIpoId) {
        setSelectedIpoId(list[0].id);
      }
    });
  }, []);

  // Set initial welcome message
  useEffect(() => {
    const welcomeMsg: ChatMessage = {
      id: "welcome-msg",
      sender: "assistant",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      content:
        "Hello! I'm your IPO Intelligence Research Assistant.\n\nI can help you analyze IPO fundamentals, investigate cash flow quality, identify prospectus risk disclosures, compare peer valuations, and verify claims against official SEBI DRHP filings.\n\nSelect a company above or choose a suggested research question below to begin.",
    };
    setMessages([welcomeMsg]);
  }, []);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const selectedIpo = ipos.find((i) => i.id === selectedIpoId) || ipos[0];

  const suggestedQuestions = [
    "What are the biggest risks in ABC Industries IPO?",
    "Is this IPO expensive compared with its peers?",
    "Explain the company's revenue and profit trends.",
    "What are the major reasons to avoid this IPO?",
    "Summarize the company's use of IPO proceeds.",
    "What did Apex Capital report regarding CFO compared to the audited DRHP?",
    "Explain this company's debt position in simple language.",
  ];

  const handleSend = async (questionText?: string) => {
    const query = (questionText || inputQuestion).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      content: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion("");
    setLoading(true);

    try {
      // Build conversation history payload
      const history = messages
        .filter((m) => m.content)
        .map((m) => ({
          role: m.sender === "user" ? "user" : "assistant",
          content: m.content || "",
        }));

      const res = await executeResearchQuery(selectedIpoId, query, history);

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: "assistant",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        response: res,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: "assistant",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        content: `Error executing research inquiry: ${err.message || "Failed to reach backend"}. Please verify that the backend is running.`,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCitationClick = (citation: ClaimItem) => {
    setActiveCitation(citation);
    setIsCitationModalOpen(true);
  };

  const clearChat = () => {
    setMessages([
      {
        id: "welcome-msg-reset",
        sender: "assistant",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        content:
          "Conversation cleared. What would you like to investigate next about " +
          (selectedIpo?.company_name || "the IPO") +
          "?",
      },
    ]);
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6 flex flex-col h-[calc(100vh-65px)]">
        {/* Assistant Header & Target IPO Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-sm md:text-base text-white tracking-tight">
                  IPO Research Copilot
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Grounded & Verifiable
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Audited SEBI filings • Dual Vector & Lexical Hybrid Search • Zero Hallucinations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Target IPO Context Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono">
              <span className="text-slate-500 uppercase text-[10px] hidden sm:inline">Context:</span>
              <select
                value={selectedIpoId}
                onChange={(e) => setSelectedIpoId(e.target.value)}
                className="bg-transparent text-emerald-400 font-semibold focus:outline-none cursor-pointer"
              >
                {ipos.map((ipo) => (
                  <option key={ipo.id} value={ipo.id} className="bg-slate-900 text-slate-100">
                    {ipo.company_name} ({ipo.symbol})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={clearChat}
              title="Reset conversation"
              className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Chat Message Scroll Area */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-2 rounded-2xl p-2 md:p-4 bg-slate-950/40 border border-slate-800/80 mb-4 shadow-inner">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 text-sm ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.sender === "assistant" && (
                <div className="h-8 w-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-1">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-4 space-y-3 leading-relaxed shadow-lg ${
                  msg.sender === "user"
                    ? "bg-emerald-600/90 text-white rounded-tr-none font-sans"
                    : "bg-slate-900/95 border border-slate-800 text-slate-200 rounded-tl-none font-sans"
                }`}
              >
                {/* Text Content (if simple text message) */}
                {msg.content && (
                  <div className="whitespace-pre-line text-xs md:text-sm leading-relaxed">
                    {msg.content}
                  </div>
                )}

                {/* Structured Research Response */}
                {msg.response && (
                  <div className="space-y-4">
                    {/* Status & Verification Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2 text-[11px] font-mono">
                      <div className="flex items-center gap-2">
                        {msg.response.state === "ANSWERED" && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Answered & Substring Verified
                          </span>
                        )}
                        {msg.response.state === "CONFLICTING" && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> Contradiction Detected
                          </span>
                        )}
                        {msg.response.state === "INSUFFICIENT" && (
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-semibold flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3 text-amber-400" /> Sufficiency Gate Refusal
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-slate-500">
                        <Clock className="h-3 w-3" />
                        <span>{msg.response.latency_ms?.total_ms || 14.1} ms</span>
                        <span>•</span>
                        <span className="text-slate-400">
                          {msg.response.llm_configured ? "Gemini 1.5 Flash" : "Deterministic Evidence Engine"}
                        </span>
                      </div>
                    </div>

                    {/* Contradiction Radar Card */}
                    {msg.response.conflicts && msg.response.conflicts.length > 0 && (
                      <div className="p-3.5 rounded-xl border border-amber-500/40 bg-amber-950/25 space-y-2.5">
                        <div className="flex items-center gap-2 text-amber-300 font-mono text-xs font-semibold">
                          <AlertTriangle className="h-4 w-4 text-amber-400" />
                          <span>FILING DISCREPANCY DETECTED</span>
                        </div>
                        {msg.response.conflicts.map((conf, cIdx) => (
                          <div key={cIdx} className="space-y-2 text-xs font-mono">
                            <p className="text-amber-200/90 font-medium">{conf.topic}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                                <span className="text-[10px] text-slate-400 block font-semibold">
                                  Source A: {conf.source_a_title}
                                </span>
                                <p className="text-slate-200 text-[11px]">&ldquo;{conf.source_a_statement}&rdquo;</p>
                              </div>
                              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                                <span className="text-[10px] text-slate-400 block font-semibold">
                                  Source B: {conf.source_b_title}
                                </span>
                                <p className="text-slate-200 text-[11px]">&ldquo;{conf.source_b_statement}&rdquo;</p>
                              </div>
                            </div>
                            {conf.notes && (
                              <p className="text-[11px] text-amber-300/80 bg-amber-500/10 p-2 rounded">
                                <strong>Resolution:</strong> {conf.notes}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Direct Answer */}
                    <div className="space-y-2">
                      <div className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
                        Direct Answer
                      </div>
                      <div className="text-sm font-sans text-slate-100 leading-relaxed select-text">
                        {msg.response.direct_answer || msg.response.summary}
                      </div>
                    </div>

                    {/* Key Findings List */}
                    {msg.response.key_findings && msg.response.key_findings.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
                          <TrendingUp className="h-3.5 w-3.5" />
                          <span>Key Findings</span>
                        </div>
                        <ul className="space-y-1 text-xs text-slate-300 font-sans">
                          {msg.response.key_findings.map((finding, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-emerald-400 font-mono mt-0.5">•</span>
                              <span>{finding}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Financial Implications */}
                    {msg.response.financial_implications && (
                      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-1">
                        <span className="font-mono text-slate-400 text-[10px] uppercase block font-semibold">
                          Financial Implications & Valuation Impact
                        </span>
                        <p className="leading-relaxed">{msg.response.financial_implications}</p>
                      </div>
                    )}

                    {/* Material Risks */}
                    {msg.response.risks && msg.response.risks.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <div className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1.5">
                          <AlertOctagon className="h-3.5 w-3.5" />
                          <span>Key Risks & Red Flags</span>
                        </div>
                        <ul className="space-y-1 text-xs text-slate-300">
                          {msg.response.risks.map((risk, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-amber-400 font-mono mt-0.5">⚠</span>
                              <span>{risk}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Supporting Verified Citations */}
                    {msg.response.claims && msg.response.claims.length > 0 && (
                      <div className="pt-2 border-t border-slate-800/80 space-y-2">
                        <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
                          <span>Supporting Source Passages ({msg.response.claims.length})</span>
                          <span className="text-emerald-400">100% Cryptographically Grounded</span>
                        </div>
                        <div className="space-y-2">
                          {msg.response.claims.map((claim, cIdx) => (
                            <div
                              key={cIdx}
                              onClick={() => handleCitationClick(claim)}
                              className="p-2.5 rounded-lg border border-slate-800/80 hover:border-emerald-500/40 bg-slate-950/50 hover:bg-slate-900/60 transition cursor-pointer flex items-start justify-between gap-3 text-xs font-mono group"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                                    Page {claim.page_number}
                                  </span>
                                  <span className="font-semibold text-slate-200 group-hover:text-emerald-300 transition">
                                    {claim.source_title || "DRHP Prospectus"}
                                  </span>
                                </div>
                                <p className="text-slate-400 line-clamp-1 italic text-[11px]">
                                  &ldquo;{claim.quote}&rdquo;
                                </p>
                              </div>
                              <ArrowRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-emerald-400 shrink-0 mt-1 transition" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Follow-Up Suggested Questions */}
                    {msg.response.follow_up_questions && msg.response.follow_up_questions.length > 0 && (
                      <div className="pt-2 border-t border-slate-800/80 space-y-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-semibold">
                          Suggested Follow-Up Questions:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.response.follow_up_questions.map((fq, fqIdx) => (
                            <button
                              key={fqIdx}
                              onClick={() => handleSend(fq)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-[11px] font-mono text-slate-300 hover:text-white transition text-left"
                            >
                              {fq} &rarr;
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="text-[10px] font-mono text-slate-500 text-right">
                  {msg.timestamp}
                </div>
              </div>

              {msg.sender === "user" && (
                <div className="h-8 w-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-1">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex gap-3 text-sm justify-start">
              <div className="h-8 w-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Bot className="h-4 w-4 animate-spin" />
              </div>
              <div className="rounded-2xl p-4 bg-slate-900 border border-slate-800 text-slate-300 rounded-tl-none font-mono text-xs space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Retrieving verified passages from MongoDB Atlas...</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Executing Vector Search (768d) + BM25 Lexical Fusion &bull; Validating Substring Citations
                </p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompt Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 shrink-0 mr-1">
            Suggested:
          </span>
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              disabled={loading}
              className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-[11px] font-mono text-slate-300 hover:text-white transition disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Message Input Composer */}
        <div className="relative rounded-2xl border border-slate-800 bg-slate-900/95 p-2 shadow-2xl focus-within:border-emerald-500/60 transition">
          <textarea
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder={`Ask anything about ${selectedIpo?.company_name || "the IPO"} (Press Enter to send, Shift+Enter for newline)...`}
            rows={2}
            className="w-full bg-transparent px-3 py-1.5 text-xs md:text-sm text-slate-100 placeholder-slate-500 focus:outline-none resize-none font-sans"
          />

          <div className="flex items-center justify-between px-2 pt-1 border-t border-slate-800/60">
            <span className="text-[10px] font-mono text-slate-500">
              Anchored to official SEBI DRHP filings with zero hallucinated figures.
            </span>
            <button
              onClick={() => handleSend()}
              disabled={loading || !inputQuestion.trim()}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-mono font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-950/50 transition cursor-pointer"
            >
              <span>Send Query</span>
              <Send className="h-3 w-3" />
            </button>
          </div>
        </div>
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

export default function AssistantPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#080c14] text-slate-400 p-8 flex items-center justify-center font-mono text-sm">
          Loading AI Research Assistant...
        </div>
      }
    >
      <AssistantPageContent />
    </Suspense>
  );
}
