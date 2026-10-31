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
import { AlertCircle, TrendingUp, FileText } from "lucide-react";
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
  if (!series || series.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-8 flex flex-col items-center justify-center text-center space-y-3">
        <div className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
          <FileText className="h-5 w-5" />
        </div>
        <h4 className="text-sm font-bold text-white font-mono">
          Financial Statements Awaiting Ingestion
        </h4>
        <p className="text-xs text-slate-400 max-w-md font-sans">
          Multi-year restated financial statements for this offering have not yet been indexed from SEBI filings. You can upload the DRHP/RHP PDF in the Documents section to chart figures immediately.
        </p>
      </div>
    );
  }

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
            Multi-year revenue expansion compared with operating cash flow (₹ in Crores)
          </p>
        </div>

        {divergenceAlert?.flag && (
          <div className="flex items-center gap-2 rounded-lg bg-red-950/40 border border-red-800/60 px-3 py-1 text-xs text-red-300 font-mono">
            <AlertCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />
            <span>{divergenceAlert.reason || "Cash Flow Divergence Detected"}</span>
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
            <ReferenceLine y={0} stroke="#475569" />
            <Bar dataKey="revenue" name="Revenue from Ops" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
            <Bar dataKey="ebitda" name="EBITDA" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
            <Line type="monotone" dataKey="cfo" name="Operating Cash Flow (CFO)" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4, fill: '#f59e0b' }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Notes */}
      <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 border-t border-slate-800 pt-3">
        <span>Restated figures extracted from SEBI DRHP/RHP Annexures</span>
        <span className="text-emerald-400">Deterministic Ratios • Verified</span>
      </div>
    </div>
  );
};
