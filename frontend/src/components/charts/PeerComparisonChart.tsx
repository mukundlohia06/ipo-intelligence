"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ReferenceLine,
} from "recharts";
import type { PeersResponse, PeerItem } from "../../lib/api";

interface PeerComparisonChartProps {
  data: PeersResponse | null;
  loading?: boolean;
}

export const PeerComparisonChart: React.FC<PeerComparisonChartProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="h-64 rounded-xl border border-slate-800 bg-slate-900/60 p-4 animate-pulse flex items-center justify-center">
        <span className="text-xs text-slate-500 font-mono">Loading valuation peer multiples...</span>
      </div>
    );
  }

  const peers = data?.peers || (data as any)?.peer_comparison || [];
  const ipoPe = typeof data?.ipo_pe === "number" ? data.ipo_pe : (data?.ipo_pe as any)?.value;

  if (!peers || peers.length === 0) {
    return (
      <div className="h-48 rounded-xl border border-slate-800 bg-slate-950/60 p-6 flex flex-col items-center justify-center text-center space-y-2">
        <span className="text-xs font-mono text-slate-400">
          Listed competitor valuation multiples for this sector are currently being indexed from BSE/NSE filings.
        </span>
        <span className="text-[11px] font-mono text-emerald-400">
          Peer benchmarks will reflect automatically once disclosed.
        </span>
      </div>
    );
  }

  // Combine IPO with peers for chart display
  const chartData = [
    ...(ipoPe !== undefined && ipoPe !== null
      ? [
          {
            company: "This IPO",
            pe: ipoPe,
            isIPO: true,
            color: "#10b981", // emerald
          },
        ]
      : []),
    ...peers.map((p: any) => ({
      company: (p.peer_name || p.symbol || "Peer").split(" ")[0],
      pe: typeof p.pe_ratio === "number" ? p.pe_ratio : parseFloat(p.pe_ratio) || 0,
      isIPO: false,
      color: "#3b82f6", // blue
    })),
  ];

  const discount = data?.pe_discount_pct || 0;
  const isDiscount = discount > 0;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-400 animate-ping"></span>
            <h3 className="text-sm font-semibold tracking-wider uppercase text-slate-200 font-mono">
              Valuation Multiple Benchmarking (P/E Multiple)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Valuation comparison vs. established Indian listed peers
          </p>
        </div>

        {discount !== 0 && (
          <div
            className={`px-3 py-1 rounded-full text-xs font-mono font-semibold border ${
              isDiscount
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : "bg-amber-500/10 text-amber-400 border-amber-500/30"
            }`}
          >
            {isDiscount ? `Discount: ${discount}% to Peer Avg` : `Premium: ${Math.abs(discount)}% to Peer Avg`}
          </div>
        )}
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: -10, bottom: 5 }}>
            <XAxis dataKey="company" stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <YAxis stroke="#64748b" tick={{ fill: "#94a3b8", fontSize: 11 }} unit="x" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0b1120",
                borderColor: "#1e293b",
                borderRadius: "8px",
                color: "#f8fafc",
                fontSize: "12px",
                fontFamily: "monospace",
              }}
              formatter={(val: any) => [`${val}x`, "P/E Multiple"]}
            />
            {data?.peer_avg_pe && (
              <ReferenceLine
                y={data.peer_avg_pe}
                stroke="#f59e0b"
                strokeDasharray="3 3"
                label={{
                  value: `Peer Avg: ${data.peer_avg_pe}x`,
                  fill: "#f59e0b",
                  fontSize: 10,
                  position: "top",
                }}
              />
            )}
            <Bar dataKey="pe" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-slate-800 pt-3">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded bg-emerald-500"></span> Target IPO
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded bg-blue-500"></span> Listed Competitors
          </span>
        </div>
        <span>Source: BSE/NSE Exchange Filings</span>
      </div>
    </div>
  );
};
