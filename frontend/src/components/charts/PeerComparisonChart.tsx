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
  if (loading || !data) {
    return (
      <div className="h-64 rounded-xl border border-slate-800 bg-slate-900/60 p-4 animate-pulse flex items-center justify-center">
        <span className="text-xs text-slate-500 font-mono">Loading valuation peer multiples...</span>
      </div>
    );
  }

  // Combine IPO with peers for chart display
  const chartData = [
    {
      company: "ABC Ind (IPO)",
      pe: data.ipo_pe,
      isIPO: true,
      color: "#10b981", // emerald
    },
    ...data.peers.map((p: PeerItem) => ({
      company: p.peer_name.split(" ")[0], // short name
      pe: p.pe_ratio,
      isIPO: false,
      color: "#3b82f6", // blue
    })),
  ];

  const discount = data.pe_discount_pct;
  const isDiscount = discount > 0;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg backdrop-blur">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-400 animate-ping"></span>
            <h3 className="text-sm font-semibold tracking-wider uppercase text-slate-200 font-mono">
              Valuation Multiple Benchmarking (P/E Ratio)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Peer multiple comparison vs. Listed Capital Goods & Energy Peers
          </p>
        </div>
        <div
          className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium border ${
            isDiscount
              ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
              : "bg-amber-950/60 border-amber-500/40 text-amber-300"
          }`}
        >
          {isDiscount ? `Discount: -${discount.toFixed(1)}%` : `Premium: +${discount.toFixed(1)}%`}
        </div>
      </div>

      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
          >
            <XAxis
              type="number"
              stroke="#64748b"
              fontSize={11}
              domain={[0, 70]}
              tickFormatter={(v) => `${v}x`}
            />
            <YAxis
              dataKey="company"
              type="category"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="rounded-lg border border-slate-700 bg-slate-950/95 p-2.5 shadow-xl text-xs font-mono">
                      <div className="font-semibold text-white">{item.company}</div>
                      <div className="text-slate-300 mt-1">
                        P/E Ratio: <span className="text-emerald-400 font-bold">{item.pe}x</span>
                      </div>
                      {item.isIPO && (
                        <div className="text-emerald-400 text-[10px] mt-0.5">
                          Offered at ~{discount.toFixed(1)}% discount to peer average ({data.peer_avg_pe.toFixed(1)}x)
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine
              x={data.peer_avg_pe}
              stroke="#f59e0b"
              strokeDasharray="4 4"
              label={{
                value: `Peer Avg: ${data.peer_avg_pe.toFixed(1)}x`,
                fill: "#f59e0b",
                fontSize: 10,
                position: "insideTopRight",
              }}
            />
            <Bar dataKey="pe" radius={[0, 6, 6, 0]} barSize={18}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isIPO ? "#10b981" : "#3b82f6"}
                  opacity={entry.isIPO ? 1 : 0.75}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
        <span className="font-mono text-slate-300">
          Peer Avg P/E: <span className="text-amber-400 font-bold">{data.peer_avg_pe.toFixed(1)}x</span>
        </span>
        <span className="text-slate-400">
          Source: Capital Market Feed & Brokerage Comps
        </span>
      </div>
    </div>
  );
};
