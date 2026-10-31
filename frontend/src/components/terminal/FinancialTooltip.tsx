"use client";

import React, { useState } from "react";
import { HelpCircle, Info } from "lucide-react";

interface FinancialTooltipProps {
  term: "pe" | "cfo_pat" | "ebitda" | "debt_equity" | "ev_ebitda" | "gmp" | "cagr" | "ronw";
  children: React.ReactNode;
}

const GLOSSARY = {
  pe: {
    title: "P/E Ratio (Price-to-Earnings)",
    description: "Indicates how many rupees investors pay for each rupee of net profit. Lower P/E compared to sector peers signals potential value discount.",
  },
  cfo_pat: {
    title: "CFO to PAT Ratio (Quality of Earnings)",
    description: "Compares Operating Cash Flow to Net Profit. A ratio below 0.5x or negative indicates profits are trapped in unpaid customer credit or unsold inventory rather than real bank cash.",
  },
  ebitda: {
    title: "EBITDA Margin",
    description: "Earnings Before Interest, Taxes, Depreciation, and Amortization as a % of revenue. Measures core operating profitability independent of financing structure.",
  },
  debt_equity: {
    title: "Debt-to-Equity Ratio",
    description: "Measures total borrowings relative to net worth. Below 0.5x indicates strong balance sheet safety; above 1.0x indicates significant debt servicing risk.",
  },
  ev_ebitda: {
    title: "EV / EBITDA",
    description: "Enterprise Value divided by EBITDA. Compares the entire firm value (equity plus debt minus cash) to cash earnings, neutral to capital structure.",
  },
  gmp: {
    title: "Grey Market Premium (GMP)",
    description: "The unofficial premium at which IPO shares trade before official exchange listing. Reflects retail and HNI sentiment and initial listing pop expectations.",
  },
  cagr: {
    title: "CAGR (Compound Annual Growth Rate)",
    description: "The annualized growth rate of financial revenue or earnings over a multi-year period, smoothing out single-year volatility.",
  },
  ronw: {
    title: "Return on Net Worth (RoNW / ROE)",
    description: "Net profit divided by shareholder equity. Measures how efficiently management generates returns on shareholders' invested capital.",
  },
};

export const FinancialTooltip: React.FC<FinancialTooltipProps> = ({ term, children }) => {
  const [show, setShow] = useState(false);
  const info = GLOSSARY[term];

  return (
    <span className="relative inline-flex items-center gap-1 group cursor-help">
      <span
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="border-b border-dotted border-slate-500 group-hover:border-emerald-400 transition"
      >
        {children}
      </span>
      <HelpCircle
        className="h-3 w-3 text-slate-500 group-hover:text-emerald-400 transition inline"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      />

      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 rounded-xl border border-slate-700 bg-slate-950 p-3 shadow-2xl z-50 text-left font-sans text-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-1.5 font-semibold text-emerald-300 font-mono text-[11px] mb-1">
            <Info className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span>{info.title}</span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">{info.description}</p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-950" />
        </div>
      )}
    </span>
  );
};
