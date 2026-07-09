"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";

type MorningBrief = {
  headline: string;
  summary: string;
  generated_at: string;
  market_mood: string;
  overnight_moves: { asset: string; move: string; price: string; significance: string }[];
  key_theme: string;
  action_items: string[];
};

type COTPosition = {
  pair: string;
  institutions: string;
  contracts: string;
  change: string;
  signal: string;
  interpretation: string;
};

type Correlation = {
  pair1: string;
  pair2: string;
  correlation: string;
  strength: string;
  meaning: string;
  trade_implication: string;
};

type EconomicSurprise = {
  event: string;
  date: string;
  expected: string;
  actual: string;
  surprise: string;
  market_reaction: string;
  ongoing_impact: string;
};

type BestTrade = {
  rank: number;
  asset: string;
  direction: string;
  entry: string;
  target: string;
  stop: string;
  confidence: number;
  timeframe: string;
  reasoning: string;
};

type Intelligence = {
  morning_brief: MorningBrief;
  cot_analysis: {
    summary: string;
    positions: COTPosition[];
    key_insight: string;
  };
  correlation_matrix: {
    summary: string;
    correlations: Correlation[];
    key_correlation_today: string;
  };
  economic_surprise_index: {
    summary: string;
    recent_surprises: EconomicSurprise[];
    surprise_index_score: Record<string, string>;
    key_insight: string;
  };
  best_trades_today: BestTrade[];
};

export default function IntelligencePage() {
  const [loading, setLoading] = useState(false);
  const [intel, setIntel] = useState<Intelligence | null>(null);
  const [error, setError] = useState("");

  async function generate() {
    setLoading(true);
    setError("");
    setIntel(null);
    try {
      const response = await fetch("/api/intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (data.error) setError(data.error);
      else setIntel(data);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-8">
          <p className="mb-3 w-fit rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1 text-sm text-blue-300">
            🏦 Market Intelligence
          </p>
          <h1 className="text-4xl font-bold">Morning Intelligence Brief</h1>
          <p className="mt-1 text-sm text-blue-400">
            📅 {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
          <p className="mt-2 text-white/40">
            Bloomberg-level institutional intelligence. COT positioning, correlations, economic surprises, and today's best trades.
          </p>
        </div>

        <button
          onClick={generate}
          disabled={loading}
          className="mb-8 w-full rounded-2xl bg-blue-600 py-4 text-lg font-semibold transition hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "🤖 Generating Intelligence Brief..." : "🏦 Generate Morning Intelligence Brief"}
        </button>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        {intel && (
          <div className="space-y-6">

            {/* Morning Brief */}
            {intel.morning_brief && (
              <div className="rounded-3xl border border-blue-500/30 bg-blue-500/5 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-blue-400">📰 Morning Brief</h2>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                    intel.morning_brief.market_mood === "Risk-On" ? "bg-green-500/20 text-green-400" :
                    intel.morning_brief.market_mood === "Risk-Off" ? "bg-red-500/20 text-red-400" :
                    "bg-yellow-500/20 text-yellow-400"
                  }`}>{intel.morning_brief.market_mood}</span>
                </div>

                <h3 className="text-2xl font-bold mb-3">{intel.morning_brief.headline}</h3>
                <p className="text-sm text-white/70 leading-relaxed mb-4">{intel.morning_brief.summary}</p>

                {/* Overnight moves */}
                <div className="grid gap-3 sm:grid-cols-3 mb-4">
                  {intel.morning_brief.overnight_moves?.map((move, i) => (
                    <div key={i} className="rounded-2xl border border-white/10 bg-black/30 p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-bold text-sm">{move.asset}</p>
                        <span className={`text-sm font-bold ${move.move.startsWith("+") ? "text-green-400" : "text-red-400"}`}>
                          {move.move}
                        </span>
                      </div>
                      <p className="text-xs text-white/40 mb-1">{move.price}</p>
                      <p className="text-xs text-white/50">{move.significance}</p>
                    </div>
                  ))}
                </div>

                {intel.morning_brief.key_theme && (
                  <div className="mb-4 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-3">
                    <p className="text-xs text-blue-400 font-semibold mb-1">🎯 Key Theme Today</p>
                    <p className="text-sm text-white/70">{intel.morning_brief.key_theme}</p>
                  </div>
                )}

                {intel.morning_brief.action_items?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-white/40 mb-2">✅ Action Items</p>
                    <div className="space-y-2">
                      {intel.morning_brief.action_items.map((item, i) => (
                        <div key={i} className="flex items-start gap-2 rounded-xl bg-white/5 p-3">
                          <span className="text-blue-400 font-bold text-sm">{i + 1}.</span>
                          <p className="text-sm text-white/70">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Best Trades Today */}
            {intel.best_trades_today?.length > 0 && (
              <div className="rounded-3xl border border-green-500/20 bg-green-500/5 p-6">
                <h2 className="mb-4 text-xl font-bold text-green-400">⭐ Today's Best Trades</h2>
                <div className="space-y-4">
                  {intel.best_trades_today.map((trade, i) => (
                    <div key={i} className={`rounded-2xl border p-4 ${
                      trade.direction === "Buy" ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5"
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold">
                            {trade.rank}
                          </span>
                          <span className="text-xl font-bold">{trade.asset}</span>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                            trade.direction === "Buy" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                          }`}>{trade.direction}</span>
                        </div>
                        <span className="rounded-full bg-blue-500/20 px-3 py-1 text-sm text-blue-400">
                          {trade.confidence}% confidence
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="rounded-xl bg-black/30 p-2 text-center">
                          <p className="text-xs text-white/30">Entry</p>
                          <p className="text-sm font-bold text-white">{trade.entry}</p>
                        </div>
                        <div className="rounded-xl bg-black/30 p-2 text-center">
                          <p className="text-xs text-white/30">Target</p>
                          <p className="text-sm font-bold text-green-400">{trade.target}</p>
                        </div>
                        <div className="rounded-xl bg-black/30 p-2 text-center">
                          <p className="text-xs text-white/30">Stop</p>
                          <p className="text-sm font-bold text-red-400">{trade.stop}</p>
                        </div>
                      </div>
                      <p className="text-xs text-white/40 mb-1">⏱ {trade.timeframe}</p>
                      <p className="text-xs text-white/60">{trade.reasoning}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* COT Analysis */}
            {intel.cot_analysis && (
              <div className="rounded-3xl border border-purple-500/20 bg-purple-500/5 p-6">
                <h2 className="mb-2 text-xl font-bold text-purple-400">🏦 COT Report — Institutional Positioning</h2>
                <p className="text-sm text-white/50 mb-4">{intel.cot_analysis.summary}</p>

                <div className="space-y-3 mb-4">
                  {intel.cot_analysis.positions?.map((pos, i) => (
                    <div key={i} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-bold">{pos.pair}</p>
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                            pos.signal === "Bullish" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                          }`}>{pos.signal}</span>
                          <span className="text-sm font-bold text-white/70">{pos.contracts}</span>
                        </div>
                      </div>
                      <p className="text-xs text-white/40 mb-1">{pos.institutions} • {pos.change}</p>
                      <p className="text-xs text-white/60">{pos.interpretation}</p>
                    </div>
                  ))}
                </div>

                {intel.cot_analysis.key_insight && (
                  <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4">
                    <p className="text-xs font-semibold text-purple-400 mb-1">💡 Key Insight</p>
                    <p className="text-sm text-white/70">{intel.cot_analysis.key_insight}</p>
                  </div>
                )}
              </div>
            )}

            {/* Correlation Matrix */}
            {intel.correlation_matrix && (
              <div className="rounded-3xl border border-yellow-500/20 bg-yellow-500/5 p-6">
                <h2 className="mb-2 text-xl font-bold text-yellow-400">🔗 Correlation Matrix</h2>
                <p className="text-sm text-white/50 mb-4">{intel.correlation_matrix.summary}</p>

                <div className="space-y-3 mb-4">
                  {intel.correlation_matrix.correlations?.map((corr, i) => (
                    <div key={i} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-bold">{corr.pair1} ↔ {corr.pair2}</p>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${
                            corr.correlation.startsWith("-") ? "text-red-400" : "text-green-400"
                          }`}>{corr.correlation}</span>
                          <span className="text-xs text-white/40">{corr.strength}</span>
                        </div>
                      </div>
                      <p className="text-xs text-white/60 mb-1">{corr.meaning}</p>
                      <p className="text-xs text-blue-400">→ {corr.trade_implication}</p>
                    </div>
                  ))}
                </div>

                {intel.correlation_matrix.key_correlation_today && (
                  <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-4">
                    <p className="text-xs font-semibold text-yellow-400 mb-1">🎯 Key Correlation Today</p>
                    <p className="text-sm text-white/70">{intel.correlation_matrix.key_correlation_today}</p>
                  </div>
                )}
              </div>
            )}

            {/* Economic Surprise Index */}
            {intel.economic_surprise_index && (
              <div className="rounded-3xl border border-orange-500/20 bg-orange-500/5 p-6">
                <h2 className="mb-2 text-xl font-bold text-orange-400">📊 Economic Surprise Index</h2>
                <p className="text-sm text-white/50 mb-4">{intel.economic_surprise_index.summary}</p>

                <div className="space-y-3 mb-4">
                  {intel.economic_surprise_index.recent_surprises?.map((surprise, i) => (
                    <div key={i} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-bold">{surprise.event}</p>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                          surprise.surprise.includes("Beat") ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                        }`}>{surprise.surprise}</span>
                      </div>
                      <div className="flex gap-4 text-xs text-white/40 mb-2">
                        <span>Expected: {surprise.expected}</span>
                        <span>Actual: {surprise.actual}</span>
                        <span>{surprise.date}</span>
                      </div>
                      <p className="text-xs text-white/60 mb-1">{surprise.market_reaction}</p>
                      <p className="text-xs text-yellow-400">Ongoing: {surprise.ongoing_impact}</p>
                    </div>
                  ))}
                </div>

                {intel.economic_surprise_index.surprise_index_score && (
                  <div className="grid gap-2 sm:grid-cols-2 mb-4">
                    {Object.entries(intel.economic_surprise_index.surprise_index_score).map(([currency, score]) => (
                      <div key={currency} className="rounded-xl border border-white/10 bg-black/30 p-3">
                        <p className="text-xs text-white/40">{currency}</p>
                        <p className="text-sm font-semibold text-white/70">{score}</p>
                      </div>
                    ))}
                  </div>
                )}

                {intel.economic_surprise_index.key_insight && (
                  <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4">
                    <p className="text-xs font-semibold text-orange-400 mb-1">💡 Key Insight</p>
                    <p className="text-sm text-white/70">{intel.economic_surprise_index.key_insight}</p>
                  </div>
                )}
              </div>
            )}

          </div>
        )}
      </div>
    </AppShell>
  );
}