"use client";

import React, { useState, useEffect } from "react";
import {
  fetchHealth,
  fetchIpos,
  fetchIpoScore,
  fetchIpoFinancials,
  fetchIpoPeers,
  executeResearchQuery,
  type HealthResponse,
  type IpoSummary,
  type ScorecardResponse,
  type FinancialsResponse,
  type PeersResponse,
  type ResearchResponse,
  type ClaimItem,
} from "../lib/api";
import { TerminalHeader } from "../components/terminal/TerminalHeader";
import { ScorecardCard } from "../components/terminal/ScorecardCard";
import { FinancialTrendsChart } from "../components/charts/FinancialTrendsChart";
import { PeerComparisonChart } from "../components/charts/PeerComparisonChart";
import { ResearchConsole } from "../components/terminal/ResearchConsole";
import { EvidencePanel } from "../components/terminal/EvidencePanel";
import { PassageViewerModal } from "../components/terminal/PassageViewerModal";
import { DocumentUploadModal } from "../components/terminal/DocumentUploadModal";

export default function TerminalPage() {
  const ipoId = "ipo_abc_industries";

  // Data states
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [ipos, setIpos] = useState<IpoSummary[]>([]);
  const [scoreData, setScoreData] = useState<ScorecardResponse | null>(null);
  const [financialsData, setFinancialsData] = useState<FinancialsResponse | null>(null);
  const [peersData, setPeersData] = useState<PeersResponse | null>(null);

  // Interaction states
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryResult, setQueryResult] = useState<ResearchResponse | null>(null);

  // Modal states
  const [activeCitation, setActiveCitation] = useState<ClaimItem | null>(null);
  const [isCitationModalOpen, setIsCitationModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Load initial data
  const loadData = async () => {
    try {
      setLoadingInitial(true);
      const [hRes, iposRes, scoreRes, finRes, peerRes] = await Promise.allSettled([
        fetchHealth(),
        fetchIpos(),
        fetchIpoScore(ipoId),
        fetchIpoFinancials(ipoId),
        fetchIpoPeers(ipoId),
      ]);

      if (hRes.status === "fulfilled") setHealth(hRes.value);
      if (iposRes.status === "fulfilled") setIpos(iposRes.value);
      if (scoreRes.status === "fulfilled") setScoreData(scoreRes.value);
      if (finRes.status === "fulfilled") setFinancialsData(finRes.value);
      if (peerRes.status === "fulfilled") setPeersData(peerRes.value);
    } catch (err) {
      console.error("Failed to load IPO terminal data:", err);
    } finally {
      setLoadingInitial(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [ipoId]);

  // Handle Query Submission
  const handleQuerySubmit = async (question: string) => {
    try {
      setQueryLoading(true);
      const res = await executeResearchQuery(ipoId, question);
      setQueryResult(res);
    } catch (err) {
      console.error("Query submission failed:", err);
    } finally {
      setQueryLoading(false);
    }
  };

  // Open Citation Viewer
  const handleCitationClick = (citation: ClaimItem) => {
    setActiveCitation(citation);
    setIsCitationModalOpen(true);
  };

  const primaryIpo = ipos.length > 0 ? ipos[0] : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#080c14] text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Header */}
      <TerminalHeader
        health={health}
        onRunDemoQuery={(query) => handleQuerySubmit(query)}
        isDemoRunning={queryLoading}
      />

      {/* Main Terminal Workspace (3-Pane Grid) */}
      <main className="flex-1 p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 max-w-[1720px] mx-auto w-full">
        {/* Left Column (Cols 1-4): Scorecard, Financials & Peer Multiples */}
        <div className="lg:col-span-4 space-y-5 flex flex-col">
          {/* 5-Dimension Scorecard Gauge */}
          <ScorecardCard scoreData={scoreData} />

          {/* Restated Financial Trends (Recharts) */}
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

          {/* Valuation Multiples vs Listed Peers (Recharts) */}
          <PeerComparisonChart data={peersData} loading={loadingInitial} />
        </div>

        {/* Center Column (Cols 5-8): Core Research Console */}
        <div className="lg:col-span-5 flex flex-col min-h-[640px]">
          <ResearchConsole
            ipoId={ipoId}
            onQuerySubmit={handleQuerySubmit}
            loading={queryLoading}
            queryResult={queryResult}
            onCitationClick={handleCitationClick}
          />
        </div>

        {/* Right Column (Cols 9-12): 1-Minute Assessment & Evidence Inspector */}
        <div className="lg:col-span-3 flex flex-col">
          <EvidencePanel
            ipo={primaryIpo}
            queryResult={queryResult}
            onCitationClick={handleCitationClick}
            onOpenUpload={() => setIsUploadModalOpen(true)}
          />
        </div>
      </main>

      {/* Primary Source Document Passage Viewer Modal */}
      <PassageViewerModal
        citation={activeCitation}
        isOpen={isCitationModalOpen}
        onClose={() => setIsCitationModalOpen(false)}
      />

      {/* Filing Ingestion Hub Modal */}
      <DocumentUploadModal
        ipoId={ipoId}
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={() => {
          loadData();
        }}
      />
    </div>
  );
}
