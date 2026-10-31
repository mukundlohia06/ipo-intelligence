import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IPO Intelligence — The AI Research Terminal for IPO Investors",
  description: "Evidence-first AI research platform for Indian IPOs using DRHPs, audited financials, peer comparisons, and verifiable citations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#090d16] text-slate-100 antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
        {children}
      </body>
    </html>
  );
}
