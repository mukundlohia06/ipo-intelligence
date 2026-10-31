"use client";

import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine
} from "recharts";
import { AlertCircle, TrendingUp } from "lucide-react";
import { ChartSeriesItem } from "../../lib/api";

interface FinancialTrendsChartProps {
  series: ChartSeriesItem[];
  divergenceAlert?: {
    flag: boolean;
    reason: string;
    severity: string;
  };
}

export const FinancialTrendsChart: React.FC<FinancialTrendsChartProps> = ({
  series,
  divergenceAlert
}) => {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 space-y-4">
      {/* Header & Divergence Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            Financial Growth & Quality of Cash Conversion
          </h4>
          <p className="text-xs text-slate-400">
            Multi-year revenue expansion compared with operating cash flow (FY22 – FY24)
          </p>
        </div>

        {divergenceAlert?.flag && (
          <div className="flex items-center gap-2 rounded-lg bg-red-950/40 border border-red-800/60 px-3 py-1 text-xs text-red-300 font-mono">
            <AlertCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
            <span>High Alert: CFO Diverged (-₹25.4 Cr)</span>
          </div>
        )}
      </div>

      {/* Chart Canvas */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={series} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="fiscal_year" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} unit=" Cr" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0b1120",
                borderColor: "#1e293b",
                borderRadius: "8px",
                color: "#f8fafc",
                fontSize: "12px",
                fontFamily: "monospace"
              }}
              formatter={(value: any) => [`₹${value} Cr`, '']}
            />
            <Legend
              wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
              formatter={(val) => <span className="text-slate-300 font-mono">{val}</span>}
            />
            <ReferenceLine y={0} stroke="#475569" strokeWidth={1.5} />
            
            {/* Revenue Bar */}
            <Bar dataKey="revenue" name="Revenue from Ops" fill="#0ea5e9" radius={[4, 4, 0, 0]} maxBarSize={36} />
            
            {/* EBITDA Bar */}
            <Bar dataKey="ebitda" name="EBITDA" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={36} />
            
            {/* Profit After Tax Line */}
            <Line type="monotone" dataKey="pat" name="PAT (Net Profit)" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: "#10b981" }} />
            
            {/* Operating Cash Flow (CFO) Line with Red / Negative Indication */}
            <Line type="monotone" dataKey="cfo" name="Operating Cash Flow (CFO)" stroke="#f59e0b" strokeWidth={2.5} strokeDasharray="4 4" dot={{ r: 5, fill: "#ef4444" }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Divergence Context Note */}
      <div className="rounded-lg bg-slate-900/60 border border-slate-800 p-2.5 text-xs text-slate-300 font-mono flex items-center justify-between">
        <span className="text-slate-400">Divergence Diagnosis:</span>
        <span className="text-amber-400 font-semibold truncate max-w-xl">
          FY24 Revenue grew +42% to ₹1,250 Cr, but CFO dipped to -₹25.4 Cr due to receivables expansion.
        </span>
      </div>
    </div>
  );
};
