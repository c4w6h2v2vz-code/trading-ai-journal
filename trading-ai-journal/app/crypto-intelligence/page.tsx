"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";

type CoinWatch = {
  coin: string;
  price: string;
  timeframe: string;
  direction: string;
  probability: number;
  potential_gain: string;
  potential_loss: string;
  risk_level: string;
  sentiment_score: number;
  momentum_score: number;
  reason: string;
  community_buzz: string;
  entry: string;
  target: string;
  stop_loss: string;
  category: string;
};

type Intelligence = {
  market_overview: {
    sentiment: string;
    fear_greed: string;
    btc_dominance: string;
    market_trend: string;
  };
  top_coins_to_watch: CoinWatch[];
  meme_coins_alert: { coin: string; reason: string; buzz_level: string; risk: string }[];
  whale_alerts: { coin: string; action: string; impact: string }[];
  coins_to_avoid: { coin: string; reason: string; risk: string }[];
  rug_pull_warnings: { coin: string; warning: string }[];
  best_trade_today: {
    coin: string;
    entry: string;
    target: string;
    stop_loss: string;
    timeframe: string;
    reason: string;
  };
  weekly_outlook: string;
};

export default function CryptoIntelligencePage() {
  const [loading, setLoading] = useState(false);
  const [intelligence, setIntelligence] = useState<Intelligence | null>(null);
  const [error, setError] = useState("");

  async function analyze() {
    setLoading(true);
    setError("");
    setIntelligence(null);
    try {
      const response = await fetch("/api/crypto-intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (data.error) {
        setError(data.error);
      } else {
        setIntelligence(data);
      }
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
          <p className="mb-3 w-fit rounded-full border border-yellow-500/30 bg-yellow-500/10 px-4 py-1 text-sm text-yellow-300">
            🪙 Crypto Intelligence
          </p>
          <h1 className="text-4xl font-bold">Crypto Market Intelligence</h1>
          <p className="mt-2 text-white/40">
            AI scans Reddit, Twitter, news, and whale movements to find the best crypto opportunities today.
          </p>
        </div>

        <button
          onClick={analyze}
          disabled={loading}
          className="mb-8 w-full rounded-2xl bg-yellow-600 py-4 text-lg font-semibold transition hover:bg-yellow-700 disabled:opacity-50"
        >
          {loading ? "🤖 AI Scanning Communities & Markets..." : "🔍 Generate Crypto Intelligence Report"}
        </button>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-400">
            {error}
          </div>
        )}

        {intelligence && (
          <div className="space-y-6">

            {/* Market Overview */}
            <div className="rounded-3xl border border-yellow-500/20 bg-yellow-500/5 p-6">
              <h2 className="mb-4 text-xl font-semibold">📊 Market Overview</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="text-sm text-white/40">Sentiment</p>
                  <p className={`text-xl font-bold mt-1 ${
                    intelligence.market_overview.sentiment === "Bullish" ? "text-green-400" :
                    intelligence.market_overview.sentiment === "Bearish" ? "text-red-400" :
                    "text-yellow-400"
                  }`}>{intelligence.market_overview.sentiment}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="text-sm text-white/40">Fear & Greed</p>
                  <p className="text-xl font-bold mt-1 text-yellow-400">{intelligence.market_overview.fear_greed}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="text-sm text-white/40">BTC Dominance</p>
                  <p className="text-xl font-bold mt-1 text-orange-400">{intelligence.market_overview.btc_dominance}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="text-sm text-white/40">Market Trend</p>
                  <p className="text-sm font-semibold mt-1 text-white/70">{intelligence.market_overview.market_trend}</p>
                </div>
              </div>
            </div>

            {/* Best Trade Today */}
            {intelligence.best_trade_today && (
              <div className="rounded-3xl border border-green-500/20 bg-green-500/5 p-6">
                <h2 className="mb-4 text-xl font-semibold text-green-400">⭐ Best Trade Today</h2>
                <div className="grid gap-3 sm:grid-cols-3 mb-4">
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-center">
                    <p className="text-xs text-white/40">Entry</p>
                    <p className="text-lg font-bold text-green-400">{intelligence.best_trade_today.entry}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-center">
                    <p className="text-xs text-white/40">Target</p>
                    <p className="text-lg font-bold text-blue-400">{intelligence.best_trade_today.target}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-center">
                    <p className="text-xs text-white/40">Stop Loss</p>
                    <p className="text-lg font-bold text-red-400">{intelligence.best_trade_today.stop_loss}</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-green-500/20 bg-black/30 p-4">
                  <p className="text-sm font-semibold text-green-400 mb-1">
                    {intelligence.best_trade_today.coin} — {intelligence.best_trade_today.timeframe}
                  </p>
                  <p className="text-sm text-white/70">{intelligence.best_trade_today.reason}</p>
                </div>
              </div>
            )}

            {/* Top Coins to Watch */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <h2 className="mb-4 text-xl font-semibold">🔭 Top Coins to Watch</h2>
              <div className="space-y-4">
                {intelligence.top_coins_to_watch?.map((coin, i) => (
                  <div key={i} className={`rounded-2xl border p-4 ${
                    coin.direction === "Bullish" ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5"
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold">{coin.coin}</span>
                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/40">{coin.category}</span>
                        <span className="text-sm text-white/40">{coin.price}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-bold ${coin.direction === "Bullish" ? "text-green-400" : "text-red-400"}`}>
                          {coin.potential_gain}
                        </span>
                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">{coin.probability}%</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="rounded-xl bg-black/30 p-2 text-center">
                        <p className="text-xs text-white/30">Entry</p>
                        <p className="text-sm font-semibold text-green-400">{coin.entry}</p>
                      </div>
                      <div className="rounded-xl bg-black/30 p-2 text-center">
                        <p className="text-xs text-white/30">Target</p>
                        <p className="text-sm font-semibold text-blue-400">{coin.target}</p>
                      </div>
                      <div className="rounded-xl bg-black/30 p-2 text-center">
                        <p className="text-xs text-white/30">Stop</p>
                        <p className="text-sm font-semibold text-red-400">{coin.stop_loss}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div>
                        <p className="text-xs text-white/30 mb-1">Sentiment</p>
                        <div className="h-1.5 rounded-full bg-white/10">
                          <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${coin.sentiment_score}%` }} />
                        </div>
                        <p className="text-xs text-blue-400 mt-0.5">{coin.sentiment_score}/100</p>
                      </div>
                      <div>
                        <p className="text-xs text-white/30 mb-1">Momentum</p>
                        <div className="h-1.5 rounded-full bg-white/10">
                          <div className="h-1.5 rounded-full bg-purple-500" style={{ width: `${coin.momentum_score}%` }} />
                        </div>
                        <p className="text-xs text-purple-400 mt-0.5">{coin.momentum_score}/100</p>
                      </div>
                    </div>

                    <p className="text-xs text-white/60 mb-1">{coin.reason}</p>
                    <p className="text-xs text-yellow-400">💬 {coin.community_buzz}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-white/30">⏱ {coin.timeframe}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${
                        coin.risk_level === "High" ? "bg-red-500/20 text-red-400" :
                        coin.risk_level === "Medium" ? "bg-yellow-500/20 text-yellow-400" :
                        "bg-green-500/20 text-green-400"
                      }`}>{coin.risk_level} Risk</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Meme Coin Alerts */}
            {intelligence.meme_coins_alert?.length > 0 && (
              <div className="rounded-3xl border border-orange-500/20 bg-orange-500/5 p-6">
                <h2 className="mb-4 text-xl font-semibold text-orange-400">🔥 Meme Coin Alerts</h2>
                <div className="space-y-3">
                  {intelligence.meme_coins_alert.map((alert, i) => (
                    <div key={i} className="rounded-2xl border border-orange-500/20 bg-black/30 p-4">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-bold text-orange-400">{alert.coin}</p>
                        <span className={`rounded-full px-2 py-0.5 text-xs ${
                          alert.buzz_level === "Very High" ? "bg-red-500/20 text-red-400" :
                          alert.buzz_level === "High" ? "bg-orange-500/20 text-orange-400" :
                          "bg-yellow-500/20 text-yellow-400"
                        }`}>{alert.buzz_level} Buzz</span>
                      </div>
                      <p className="text-sm text-white/60">{alert.reason}</p>
                      <p className="text-xs text-white/30 mt-1">Risk: {alert.risk}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Whale Alerts */}
            {intelligence.whale_alerts?.length > 0 && (
              <div className="rounded-3xl border border-blue-500/20 bg-blue-500/5 p-6">
                <h2 className="mb-4 text-xl font-semibold text-blue-400">🐋 Whale Alerts</h2>
                <div className="space-y-3">
                  {intelligence.whale_alerts.map((alert, i) => (
                    <div key={i} className="rounded-2xl border border-blue-500/20 bg-black/30 p-4">
                      <p className="font-bold text-blue-400 mb-1">{alert.coin}</p>
                      <p className="text-sm text-white/60">{alert.action}</p>
                      <p className="text-xs text-green-400 mt-1">{alert.impact}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Coins to Avoid */}
            {intelligence.coins_to_avoid?.length > 0 && (
              <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-6">
                <h2 className="mb-4 text-xl font-semibold text-red-400">❌ Coins to Avoid</h2>
                <div className="space-y-3">
                  {intelligence.coins_to_avoid.map((coin, i) => (
                    <div key={i} className="rounded-2xl border border-red-500/20 bg-black/30 p-4">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-bold text-red-400">{coin.coin}</p>
                        <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400">{coin.risk} Risk</span>
                      </div>
                      <p className="text-sm text-white/60">{coin.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rug Pull Warnings */}
            {intelligence.rug_pull_warnings?.length > 0 && (
              <div className="rounded-3xl border border-red-500/50 bg-red-500/10 p-6">
                <h2 className="mb-4 text-xl font-semibold text-red-400">⚠️ Rug Pull Warnings</h2>
                <div className="space-y-3">
                  {intelligence.rug_pull_warnings.map((warn, i) => (
                    <div key={i} className="rounded-2xl border border-red-500/20 bg-black/30 p-4">
                      <p className="font-bold text-red-400 mb-1">{warn.coin}</p>
                      <p className="text-sm text-white/60">{warn.warning}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Weekly Outlook */}
            {intelligence.weekly_outlook && (
              <div className="rounded-3xl border border-purple-500/20 bg-purple-500/5 p-6">
                <h2 className="mb-3 text-xl font-semibold text-purple-400">📅 Weekly Outlook</h2>
                <p className="text-sm text-white/70 leading-relaxed">{intelligence.weekly_outlook}</p>
              </div>
            )}

          </div>
        )}
      </div>
    </AppShell>
  );
}