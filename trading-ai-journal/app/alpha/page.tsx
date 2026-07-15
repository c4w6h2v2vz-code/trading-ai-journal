"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";

type Opportunity = {
  address?: string;
  symbol: string;
  name: string;
  price: string;
  ai_score: number;
  risk_score: number;
  score_explanation: string;
  entry_zone: string;
  stop_loss: string;
  take_profit: string;
  risk_reward: string;
  market_cap: string;
  liquidity: string;
  volume_24h: string;
  reason: string;
};

type AlphaBrief = {
  analysis_date: string;
  market_grade: string;
  market_bias: string;
  btc_trend: string;
  sol_trend: string;
  risk_level: string;
  ai_market_summary: string;
  top_opportunities: Opportunity[];
  high_risk_opportunities: { symbol: string; reason: string }[];
  coins_to_avoid: { symbol: string; reason: string }[];
  volume_breakouts: { symbol: string; detail: string }[];
  rug_pull_warnings: { symbol: string; warning: string }[];
};

export default function AlphaPage() {
  const [loading, setLoading] = useState(false);
  const [brief, setBrief] = useState<AlphaBrief | null>(null);
  const [error, setError] = useState("");
  const [expandedToken, setExpandedToken] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError("");
    setBrief(null);
    try {
      const response = await fetch("/api/alpha", { method: "POST" });
      const data = await response.json();
      if (data.error) setError(data.error);
      else setBrief(data);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <p className="w-fit rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1 text-sm text-purple-300">
              ⚡ Alpha
            </p>
            <span className="rounded-full border border-green-500/30 bg-green-500/10 px-3 py-0.5 text-xs text-green-400">
              REAL DATA
            </span>
          </div>
          <h1 className="text-4xl font-bold">AI Morning Alpha Brief</h1>
          <p className="mt-2 text-white/40">
            Real Solana token data from DexScreener + RugCheck. Research and risk-ranking only — not financial advice, not a signal service.
            Execute trades manually on Axiom or your preferred DEX.
          </p>
        </div>

        <button
          onClick={generate}
          disabled={loading}
          className="mb-8 w-full rounded-2xl bg-purple-600 py-4 text-lg font-semibold transition hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? "🤖 Scanning Solana Markets..." : "🌅 Generate Today's Alpha Brief"}
        </button>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-400 text-sm">{error}</div>
        )}

        {brief && (
          <div className="space-y-6">

            {/* Market Overview */}
            <div className="rounded-3xl border border-purple-500/30 bg-purple-500/5 p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-white/40">{brief.analysis_date}</p>
                <span className={`rounded-full px-3 py-1 text-sm font-bold ${
                  brief.market_grade === "A" ? "bg-green-500/20 text-green-400" :
                  brief.market_grade === "B" ? "bg-blue-500/20 text-blue-400" :
                  brief.market_grade === "C" ? "bg-yellow-500/20 text-yellow-400" :
                  "bg-red-500/20 text-red-400"
                }`}>
                  Market Grade: {brief.market_grade}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 mb-4">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                  <p className="text-xs text-white/40">Market Bias</p>
                  <p className="text-sm font-semibold mt-1">{brief.market_bias}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                  <p className="text-xs text-white/40">Risk Level</p>
                  <p className={`text-sm font-bold mt-1 ${
                    brief.risk_level === "Low" ? "text-green-400" :
                    brief.risk_level === "Medium" ? "text-yellow-400" :
                    "text-red-400"
                  }`}>{brief.risk_level}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                  <p className="text-xs text-white/40">BTC Trend</p>
                  <p className="text-sm mt-1">{brief.btc_trend}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                  <p className="text-xs text-white/40">SOL Trend</p>
                  <p className="text-sm mt-1">{brief.sol_trend}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-purple-500/20 bg-black/30 p-4">
                <p className="text-xs text-purple-400 font-semibold mb-2">🤖 AI Market Summary</p>
                <p className="text-sm text-white/70 leading-relaxed">{brief.ai_market_summary}</p>
              </div>
            </div>

            {/* Top Opportunities */}
            {brief.top_opportunities?.length > 0 && (
              <div>
                <h2 className="mb-4 text-xl font-semibold">🎯 Today's Top Opportunities</h2>
                <div className="space-y-3">
                  {brief.top_opportunities.map((op, i) => (
                    <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <button
                        onClick={() => setExpandedToken(expandedToken === op.symbol ? null : op.symbol)}
                        className="w-full text-left"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-sm font-bold">{i + 1}</span>
                            <div>
                              <span className="font-bold text-lg">{op.symbol}</span>
                              <span className="ml-2 text-sm text-white/40">{op.price}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                              op.ai_score >= 70 ? "bg-green-500/20 text-green-400" :
                              op.ai_score >= 50 ? "bg-yellow-500/20 text-yellow-400" :
                              "bg-red-500/20 text-red-400"
                            }`}>AI {op.ai_score}</span>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                              op.risk_score <= 40 ? "bg-green-500/20 text-green-400" :
                              op.risk_score <= 65 ? "bg-yellow-500/20 text-yellow-400" :
                              "bg-red-500/20 text-red-400"
                            }`}>Risk {op.risk_score}</span>
                          </div>
                        </div>
                        <p className="text-xs text-white/50">{op.reason}</p>
                      </button>

                      {expandedToken === op.symbol && (
                        <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
                          <div className="grid grid-cols-3 gap-2">
                            <div className="rounded-xl bg-black/30 p-2 text-center">
                              <p className="text-xs text-white/30">Entry Zone</p>
                              <p className="text-xs font-semibold text-white">{op.entry_zone}</p>
                            </div>
                            <div className="rounded-xl bg-black/30 p-2 text-center">
                              <p className="text-xs text-white/30">Stop Loss</p>
                              <p className="text-xs font-semibold text-red-400">{op.stop_loss}</p>
                            </div>
                            <div className="rounded-xl bg-black/30 p-2 text-center">
                              <p className="text-xs text-white/30">Take Profit</p>
                              <p className="text-xs font-semibold text-green-400">{op.take_profit}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="rounded-xl bg-black/30 p-2 text-center">
                              <p className="text-xs text-white/30">Market Cap</p>
                              <p className="text-xs font-semibold">{op.market_cap}</p>
                            </div>
                            <div className="rounded-xl bg-black/30 p-2 text-center">
                              <p className="text-xs text-white/30">Liquidity</p>
                              <p className="text-xs font-semibold">{op.liquidity}</p>
                            </div>
                            <div className="rounded-xl bg-black/30 p-2 text-center">
                              <p className="text-xs text-white/30">24h Volume</p>
                              <p className="text-xs font-semibold">{op.volume_24h}</p>
                            </div>
                          </div>
                          <div className="rounded-xl bg-purple-500/10 p-3">
                            <p className="text-xs text-purple-300 font-semibold mb-1">Why these scores</p>
                            <p className="text-xs text-white/60">{op.score_explanation}</p>
                          </div>
                          <p className="text-xs text-white/30">R:R {op.risk_reward} · Execute manually on Axiom or your DEX</p>
                          {op.address && (
                            <button onClick={() => window.location.href = `/alpha/token/${op.address}`} className="w-full rounded-xl bg-purple-600 py-2.5 text-sm font-semibold hover:bg-purple-700 transition">🔍 Full Analysis →</button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* High Risk Opportunities */}
            {brief.high_risk_opportunities?.length > 0 && (
              <div className="rounded-3xl border border-orange-500/20 bg-orange-500/5 p-6">
                <h2 className="mb-4 text-xl font-semibold text-orange-400">⚠️ High-Risk Opportunities</h2>
                <div className="space-y-2">
                  {brief.high_risk_opportunities.map((h, i) => (
                    <div key={i} className="rounded-2xl border border-orange-500/20 bg-black/30 p-3">
                      <p className="font-bold text-orange-400">{h.symbol}</p>
                      <p className="text-xs text-white/60">{h.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Volume Breakouts */}
            {brief.volume_breakouts?.length > 0 && (
              <div className="rounded-3xl border border-blue-500/20 bg-blue-500/5 p-6">
                <h2 className="mb-4 text-xl font-semibold text-blue-400">📊 Volume Breakouts</h2>
                <div className="space-y-2">
                  {brief.volume_breakouts.map((v, i) => (
                    <div key={i} className="rounded-2xl border border-blue-500/20 bg-black/30 p-3">
                      <p className="font-bold text-blue-400">{v.symbol}</p>
                      <p className="text-xs text-white/60">{v.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Coins to Avoid */}
            {brief.coins_to_avoid?.length > 0 && (
              <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-6">
                <h2 className="mb-4 text-xl font-semibold text-red-400">❌ Coins to Avoid</h2>
                <div className="space-y-2">
                  {brief.coins_to_avoid.map((c, i) => (
                    <div key={i} className="rounded-2xl border border-red-500/20 bg-black/30 p-3">
                      <p className="font-bold text-red-400">{c.symbol}</p>
                      <p className="text-xs text-white/60">{c.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rug Pull Warnings */}
            {brief.rug_pull_warnings?.length > 0 && (
              <div className="rounded-3xl border border-red-500/50 bg-red-500/10 p-6">
                <h2 className="mb-4 text-xl font-semibold text-red-400">🚨 Rug Pull Warnings</h2>
                <div className="space-y-2">
                  {brief.rug_pull_warnings.map((r, i) => (
                    <div key={i} className="rounded-2xl border border-red-500/30 bg-black/30 p-3">
                      <p className="font-bold text-red-400">{r.symbol}</p>
                      <p className="text-xs text-white/60">{r.warning}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Coming Soon */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
              <h2 className="mb-2 text-lg font-semibold text-white/40">🔜 Coming in Phase B</h2>
              <p className="text-sm text-white/30">
                Smart wallet tracking, whale activity alerts, developer wallet behavior analysis, and holder growth data —
                these require premium on-chain data providers and will be added once approved.
              </p>
            </div>

            {/* Disclaimer */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
              <p className="text-xs text-white/20 text-center">
                ⚠️ Research and risk-ranking only, not financial advice. Scores are not profit predictions.
                Always verify data independently before trading. Never invest more than you can afford to lose.
              </p>
            </div>

          </div>
        )}
      </div>
    </AppShell>
  );
}