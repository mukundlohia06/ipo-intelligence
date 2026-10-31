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
  PlusCircle,
  Trash2,
} from "lucide-react";
import { Navbar } from "../../components/navigation/Navbar";
import { PassageViewerModal } from "../../components/terminal/PassageViewerModal";
import {
  fetchIpos,
  fetchHealth,
  executeResearchQuery,
  clearConversation,
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
  const initialIpo = searchParams.get("ipo") || "ipo_hyundai_motor_india";
  const initialDoc = searchParams.get("doc") || "";

  const [ipos, setIpos] = useState<IpoSummary[]>([]);
  const [selectedIpoId, setSelectedIpoId] = useState<string>(initialIpo);
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>(initialDoc);
  const [researchScope, setResearchScope] = useState<"doc_only" | "ipo_all" | "general">(
    initialDoc ? "doc_only" : "ipo_all"
  );
  const [conversationId, setConversationId] = useState<string>(() => "conv_" + Math.random().toString(36).substring(2, 9));
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuestion, setInputQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeCitation, setActiveCitation] = useState<ClaimItem | null>(null);
  const [isCitationModalOpen, setIsCitationModalOpen] = useState(false);
  const [geminiConfigured, setGeminiConfigured] = useState<boolean | null>(null);
  const [geminiModelName, setGeminiModelName] = useState<string>("gemini-3.5-flash-lite");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check backend health & Gemini status
  useEffect(() => {
    fetchHealth().then((h) => {
      setGeminiConfigured(Boolean(h?.providers?.llm?.configured));
      if (h?.providers?.llm?.model) {
        setGeminiModelName(h.providers.llm.model);
      }
    }).catch(() => setGeminiConfigured(false));
  }, []);

  // Load IPOs for context dropdown
  useEffect(() => {
    fetchIpos().then((list) => {
      setIpos(list);
      if (list.length > 0 && !selectedIpoId) {
        setSelectedIpoId(list[0].id);
      }
    });
  }, []);

  // Load documents for selected IPO
  useEffect(() => {
    if (selectedIpoId && selectedIpoId !== "all") {
      import("../../lib/api").then(({ fetchDocuments }) => {
        fetchDocuments(selectedIpoId).then((docs) => {
          setDocuments(docs);
          if (initialDoc && docs.some((d) => d.id === initialDoc)) {
            setSelectedDocId(initialDoc);
            setResearchScope("doc_only");
          } else if (docs.length > 0 && researchScope === "doc_only" && !selectedDocId) {
            setSelectedDocId(docs[0].id);
          }
        });
      });
    }
  }, [selectedIpoId, initialDoc]);

  // Set initial welcome message
  useEffect(() => {
    const welcomeMsg: ChatMessage = {
      id: "welcome-msg",
      sender: "assistant",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      content:
        "Hello! I am IPO Intelligence, your evidence-driven IPO research assistant.\n\nI can analyze Indian IPOs, evaluate business models, calculate deterministic financial ratios, investigate prospectus risk disclosures, compare peer valuations, and verify claims against official SEBI DRHP filings.\n\nSelect a research scope above or ask any natural-language inquiry below to begin.",
    };
    setMessages([welcomeMsg]);
  }, []);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const selectedIpo = ipos.find((i) => i.id === selectedIpoId) || ipos[0];
  const selectedDoc = documents.find((d) => d.id === selectedDocId);
  const companyShortName = selectedIpo?.company_name?.split(" ")[0] || "this company";

  const suggestedQuestions =
    researchScope === "doc_only" && selectedDoc
      ? [
          `What are the major risk factors mentioned in this document?`,
          `What is the company's revenue for the last three financial years?`,
          `What are the related-party transactions or royalties in this filing?`,
          `What percentage of the issue is an Offer for Sale (OFS)?`,
          `Explain the objects of the offer and use of IPO proceeds.`,
          `What are the company's borrowings and debt position?`,
          `What does the document say about customer concentration?`,
        ]
      : researchScope === "general"
      ? [
          "Analyse Swiggy's IPO.",
          "Compare Swiggy and Zomato.",
          "Explain the difference between Fresh Issue and Offer for Sale (OFS).",
          "What should a retail investor examine before applying for an IPO?",
          "What are the major red flags investors should look for in a DRHP?",
          "Compare the valuation of Hyundai Motor India vs Maruti Suzuki."
        ]
      : [
          `Analyse ${selectedIpo?.company_name || "this IPO"}.`,
          `Explain the company's business model.`,
          `What are the biggest financial and operational risks?`,
          `Is ${selectedIpo?.symbol || "this IPO"} valuation expensive compared to peers?`,
          `Explain the company's revenue growth and profitability.`,
          `Summarize the objects of the offer and use of IPO proceeds.`,
          `Explain this company's debt position and cash flow quality.`,
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
      // Build conversation history payload preserving both user questions and assistant answers
      const history = messages
        .filter((m) => m.content || m.response?.direct_answer)
        .map((m) => ({
          role: m.sender === "user" ? "user" : "assistant",
          content: m.content || m.response?.direct_answer || "",
        }));

      const targetIpoId = researchScope === "general" ? "all" : selectedIpoId;
      const targetDocId = researchScope === "doc_only" ? selectedDocId || undefined : undefined;

      const res = await executeResearchQuery(
        targetIpoId,
        query,
        history,
        targetDocId,
        conversationId
      );

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

  const startNewChat = () => {
    const newId = "conv_" + Math.random().toString(36).substring(2, 9);
    setConversationId(newId);
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: "assistant",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        content:
          "Started a new research session. What would you like to investigate next about " +
          (researchScope === "general" ? "Indian IPOs" : (selectedIpo?.company_name || "the offering")) +
          "?",
      },
    ]);
  };

  const handleClearThread = async () => {
    await clearConversation(conversationId);
    startNewChat();
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
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono flex items-center gap-1 font-semibold ${
                    geminiConfigured
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                      : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      geminiConfigured ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                    }`}
                  />
                  {geminiConfigured
                    ? `Gemini Active (${geminiModelName})`
                    : "Extractive Fallback Mode"}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Official Google GenAI SDK • Multi-Turn Memory • Deterministic Ratios • Zero Hallucinations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Target IPO Context Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono">
              <span className="text-slate-500 uppercase text-[10px] hidden sm:inline">IPO:</span>
              <select
                value={selectedIpoId}
                onChange={(e) => {
                  setSelectedIpoId(e.target.value);
                  setSelectedDocId("");
                }}
                className="bg-transparent text-emerald-400 font-semibold focus:outline-none cursor-pointer max-w-[150px] truncate"
              >
                {ipos.map((ipo) => (
                  <option key={ipo.id} value={ipo.id} className="bg-slate-900 text-slate-100">
                    {ipo.company_name} ({ipo.symbol})
                  </option>
                ))}
              </select>
            </div>

            {/* Document Isolation Scope Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono">
              <span className="text-slate-500 uppercase text-[10px] hidden sm:inline">Document:</span>
              <select
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer max-w-[170px] truncate"
              >
                <option value="" className="bg-slate-900 text-slate-100">
                  All Sources
                </option>
                {documents.map((doc) => (
                  <option key={doc.id} value={doc.id} className="bg-slate-900 text-slate-100">
                    📄 {doc.title} ({doc.pages}p)
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={startNewChat}
              title="New Chat Session"
              className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition flex items-center gap-1 text-xs font-mono"
            >
              <PlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline">New</span>
            </button>

            <button
              onClick={handleClearThread}
              title="Clear Thread"
              className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-red-400 transition"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 3-Tab Research Scope Selector Bar */}
        <div className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-800 bg-slate-900/60 mb-3 text-xs font-mono">
          <span className="text-slate-500 px-2 uppercase text-[10px]">Scope:</span>
          
          <button
            onClick={() => setResearchScope("doc_only")}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              researchScope === "doc_only"
                ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>This Document Only</span>
          </button>

          <button
            onClick={() => setResearchScope("ipo_all")}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              researchScope === "ipo_all"
                ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>This IPO — All Sources</span>
          </button>

          <button
            onClick={() => setResearchScope("general")}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              researchScope === "general"
                ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>General IPO Research</span>
          </button>
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
                            <CheckCircle2 className="h-3 w-3" /> Answered & Grounded
                          </span>
                        )}
                        {msg.response.state === "UNCONFIGURED" && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> Gemini Key Required
                          </span>
                        )}
                        {msg.response.state === "AUTH_ERROR" && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 font-semibold flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> Gemini Auth Error (403)
                          </span>
                        )}
                        {msg.response.state === "QUOTA_EXHAUSTED" && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Quota Limit Reached (429)
                          </span>
                        )}
                        {msg.response.state === "CONFLICTING" && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-semibold flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> Discrepancy Noted
                          </span>
                        )}
                        {msg.response.state === "INSUFFICIENT" && (
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-semibold flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3 text-amber-400" /> Evidence Gate Refusal
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-slate-500">
                        <Clock className="h-3 w-3" />
                        <span>{msg.response.latency_ms?.total_ms || 12} ms</span>
                        <span>•</span>
                        <span className="text-slate-400">
                          {msg.response.llm_provider || (msg.response.llm_configured ? "Google Gemini" : "Extractive Engine")}
                        </span>
                      </div>
                    </div>

                    {/* Direct Answer */}
                    <div className="text-sm md:text-base text-slate-100 font-sans leading-relaxed whitespace-pre-line">
                      {msg.response.direct_answer}
                    </div>

                    {/* Key Findings List */}
                    {msg.response.key_findings && msg.response.key_findings.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <h4 className="text-xs font-mono uppercase text-slate-400 font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                          <span>Key Findings</span>
                        </h4>
                        <ul className="space-y-1 text-xs text-slate-300 font-sans list-disc list-inside">
                          {msg.response.key_findings.map((kf, idx) => (
                            <li key={idx} className="leading-relaxed">
                              {kf}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Citations & Evidence Passages */}
                    {msg.response.claims && msg.response.claims.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-slate-800/80">
                        <h4 className="text-[11px] font-mono uppercase text-slate-400 font-semibold flex items-center gap-1.5">
                          <BookOpen className="h-3 w-3 text-teal-400" />
                          <span>Statutory Prospectus Citations</span>
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {msg.response.claims.map((claim, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleCitationClick(claim)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/40 text-left transition text-xs font-mono text-slate-300 max-w-full group"
                            >
                              <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold">
                                <span>[Citation #{idx + 1}]</span>
                                <span>• Page {claim.page_number || 1}</span>
                              </div>
                              <div className="text-slate-300 text-[11px] italic truncate max-w-xs group-hover:text-white transition">
                                &quot;{claim.quote || claim.text}&quot;
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Follow-up Question Suggestions */}
                    {msg.response.follow_up_questions && msg.response.follow_up_questions.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
                        <h4 className="text-[10px] font-mono uppercase text-slate-500 font-semibold">
                          Follow-up Suggestions
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.response.follow_up_questions.map((fq, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSend(fq)}
                              className="text-left text-xs font-mono text-emerald-400 hover:text-emerald-300 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg transition"
                            >
                              + {fq}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {msg.sender === "user" && (
                <div className="h-8 w-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-1">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 text-sm justify-start">
              <div className="h-8 w-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Bot className="h-4 w-4 animate-spin" />
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-slate-400 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Synthesizing evidence with Gemini & checking citations...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Inquiries */}
        <div className="mb-3 overflow-x-auto pb-1 flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="text-[10px] uppercase text-slate-500 shrink-0">Suggestions:</span>
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              disabled={loading}
              className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-white transition disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="relative rounded-2xl border border-slate-800 bg-slate-900/90 p-2 shadow-2xl flex items-end gap-2">
          <textarea
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask any question about ${researchScope === "general" ? "any Indian IPO" : (selectedIpo?.company_name || "this IPO")}... (e.g. business model, valuation, risk factors, debt)`}
            rows={2}
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 resize-none focus:outline-none p-2 font-sans"
          />

          <button
            onClick={() => handleSend()}
            disabled={!inputQuestion.trim() || loading}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 text-slate-950 font-mono font-bold text-xs transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 disabled:shadow-none"
          >
            <span>Ask</span>
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </main>

      {/* Citation Passage Modal */}
      {activeCitation && (
        <PassageViewerModal
          isOpen={isCitationModalOpen}
          onClose={() => setIsCitationModalOpen(false)}
          citation={activeCitation}
        />
      )}
    </div>
  );
}

export default function AssistantPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#080c14] text-slate-100 flex items-center justify-center font-mono text-sm">
          Loading AI IPO Research Assistant...
        </div>
      }
    >
      <AssistantPageContent />
    </Suspense>
  );
}
