"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  Layers,
  FileText,
  Activity,
  Award,
  ChevronRight,
  TrendingUp,
  BarChart3,
  Bot,
} from "lucide-react";
import { fetchHealth, type HealthResponse } from "../../lib/api";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [health, setHealth] = useState<HealthResponse | null>(null);

  useEffect(() => {
    fetchHealth().then((h) => setHealth(h)).catch(() => {});
  }, []);

  const navItems = [
    { label: "Dashboard", href: "/" },
    { label: "Explore IPOs", href: "/#ipos-catalog" },
    { label: "AI Assistant", href: "/assistant", highlight: true },
    { label: "Documents", href: "/documents" },
    { label: "Evaluation", href: "/eval" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-[#090d16]/95 backdrop-blur px-4 md:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo & Tagline */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-slate-950 font-black text-sm tracking-wider shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              IPO
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-100 tracking-tight text-sm md:text-base">
                  IPO Intelligence
                </span>
                <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                  AI Terminal
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans hidden sm:block">
                The Evidence-First AI Research Platform for IPO Investors
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 font-mono text-xs">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    item.highlight
                      ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 font-semibold"
                      : isActive
                      ? "bg-slate-800 text-white font-medium"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  {item.highlight && <Sparkles className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Side Controls & Status */}
        <div className="flex items-center gap-3">
          {/* Health Status Indicator */}
          <div className="hidden lg:flex items-center gap-2 font-mono text-[11px]">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300">
              <span
                className={`h-2 w-2 rounded-full ${
                  health?.status === "online" ? "bg-emerald-400 animate-ping" : "bg-amber-400"
                }`}
              />
              <span>API: {health?.status === "online" ? "Online" : "Connecting"}</span>
            </div>
          </div>

          {/* Prominent Call to Action */}
          <Link
            href="/assistant"
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-semibold shadow-md shadow-emerald-950/50 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Bot className="h-3.5 w-3.5" />
            <span>Ask AI Assistant</span>
          </Link>
        </div>
      </div>
    </header>
  );
};
