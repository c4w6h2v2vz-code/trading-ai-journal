"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";

const DEMO_TOKENS = [
  { name: "BONK", price: 0.0000234, change: 45.2, volume: "12.4M", mcap: "1.8B", liquidity: "4.2M", alpha: 82, trend: "🔥", risk: "Medium", category: "Meme" },
  { name: "WIF", price: 2.34, change: 28.7, volume: "8.9M", mcap: "2.3B", liquidity: "6.1M", alpha: 78, trend: "🔥", risk: "Medium", category: "Meme" },
  { name: "POPCAT", price: 0.87, change: 19.3, volume: "5.2M", mcap: "850M", liquidity: "2.8M", alpha: 71, trend: "📈", risk: "High", category: "Meme" },
  { name: "JUP", price: 1.12, change: 12.1, volume: "15.7M", mcap: "1.5B", liquidity: "8.3M", alpha: 85, trend: "📈", risk: "Low", category: "DeFi" },
  { name: "RENDER", price: 8.45, change: 8.9, volume: "22.1M", mcap: "3.2B", liquidity: "12.5M", alpha: 88, trend: "📈", risk: "Low", category: "AI" },
  { name: "PYTH", price: 0.42, change: -5.3, volume: "3.1M", mcap: "680M", liquidity: "1.9M", alpha: 62, trend: "📉", risk: "Medium", category: "Oracle" },
  { name: "MYRO", price: 0.067, change: 67.8, volume: "4.8M", mcap: "67M", liquidity: "890K", alpha: 58, trend: "🔥🔥", risk: "Very High", category: "Meme" },
  { name: "SLERF", price: 0.23, change: -12.4, volume: "1.2M", mcap: "23M", liquidity: "340K", alpha: 35, trend: "📉", risk: "Very High", category: "Meme" },
];

const DEMO_NEW_LAUNCHES = [
  { name: "CATGPT", age: "2 hours", price: 0.00012, change: 340, liquidity: "45K", holders: 234, risk: "Extreme", alpha: 22 },
  { name: "SOLDOG", age: "5 hours", price: 0.0034, change: 180, liquidity: "120K", holders: 567, risk: "Very High", alpha: 38 },
  { name: "TRUMPSOL", age: "12 hours", price: 0.089, change: 95, liquidity: "280K", holders: 1240, risk: "High", alpha: 45 },
];

const DEMO_WALLET_ACTIVITY = [
  { wallet: "7xKp...3mFq", action: "Bought", token: "BONK", amount: "$240,000", time: "12 min ago", type: "Smart Wallet" },
  { wallet: "9aRt...7nWz", action: "Sold", token: "SLERF", amount: "$89,000", time: "34 min ago", type: "Whale" },
  { wallet: "4bCd...2kLm", action: "Bought", token: "WIF", amount: "$520,000", time: "1 hour ago", type: "Insider" },
  { wallet: "8eFg...5jHi", action: "Bought", token: "POPCAT", amount: "$175,000", time: "2 hours ago", type: "Smart Wallet" },
  { wallet: "2gHi...9pQr", action: "Sold", token: "MYRO", amount: "$340,000", time: "3 hours ago", type: "Developer" },
];

const DEMO_HIGH_RISK = [
  { name: "CATGPT", risk: "Extreme", reason: "No audit, dev holds 45% supply, liquidity only $45K", flags: ["No Audit", "Dev Concentrated", "Low Liquidity"] },
  { name: "SLERF", risk: "Very High", reason: "Liquidity dropping, holder count declining, dev wallet active", flags: ["Declining Liquidity", "Losing Holders", "Dev Selling"] },
  { name: "TRUMPSOL", risk: "High", reason: "Political token, high volatility, no real utility", flags: ["No Utility", "Extreme Volatility", "Pump & Dump Risk"] },
];

export default function AlphaPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("trending");

  const filteredTokens = searchQuery
    ? DEMO_TOKENS.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : DEMO_TOKENS;

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <p className="w-fit rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1 text-sm text-purple-300">
              ⚡ Alpha
            </p>
            <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-0.5 text-xs text-yellow-400">
              DEMO DATA
            </span>
          </div>
          <h1 className="text-4xl font-bold">PipTrak Alpha</h1>
          <p className="mt-2 text-white/40">
            AI-powered Solana memecoin research. Risk rankings, smart wallet tracking, and market intelligence.
          </p>
          <p className="mt-1 text-xs text-yellow-400">
            ⚠️ This is demo data for preview. Real data coming soon. Not financial advice.
          </p>
        </div>

        {/* Market Overview */}
        <div className="mb-6 grid gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs text-white/40">Total Crypto Market</p>
            <p className="text-xl font-bold text-blue-400 mt-1">$2.34T</p>
            <p className="text-xs text-green-400">+2.1%</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs text-white/40">SOL Price</p>
            <p className="text-xl font-bold text-purple-400 mt-1">$178.50</p>
            <p className="text-xs text-green-400">+4.8%</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs text-white/40">Fear & Greed</p>
            <p className="text-xl font-bold text-yellow-400 mt-1">72</p>
            <p className="text-xs text-yellow-400">Greed</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs text-white/40">SOL Meme Volume</p>
            <p className="text-xl font-bold text-green-400 mt-1">$89.4M</p>
            <p className="text-xs text-green-400">+34% vs yesterday</p>
          </div>
        </div>

        {/* AI Market Summary */}
        <div className="mb-6 rounded-3xl border border-purple-500/20 bg-purple-500/5 p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🤖</span>
            <h2 className="text-lg font-semibold text-purple-400">AI Market Summary</h2>
          </div>
          <p className="text-sm text-white/70 leading-relaxed">
            Solana meme season is heating up with 34% more volume than yesterday. Smart wallets are accumulating BONK and WIF aggressively.
            New launches are showing extreme volatility — CATGPT pumped 340% in 2 hours but has no audit and dev holds 45% of supply.
            Risk-adjusted, JUP and RENDER offer the best setups today with strong fundamentals and growing institutional interest.
            Avoid SLERF — liquidity is declining and developer wallet has been selling since yesterday.
          </p>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="🔍 Search any Solana token..."
            className="w-full rounded-2xl border border-white/10 bg-black/50 p-4 text-white outline-none focus:border-purple-500"
          />
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 overflow-x-auto">
          {[
            { id: "trending", label: "🔥 Trending" },
            { id: "new", label: "🆕 New Launches" },
            { id: "watchlist", label: "👁️ AI Watchlist" },
            { id: "risk", label: "⚠️ High Risk" },
            { id: "wallets", label: "🐋 Smart Wallets" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                selectedTab === tab.id
                  ? "bg-purple-600 text-white"
                  : "bg-white/5 text-white/40 hover:bg-white/10"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Trending Tokens */}
        {selectedTab === "trending" && (
          <div className="space-y-3">
            <h2 className="text-xl font-semibold mb-2">🔥 Trending Tokens</h2>
            {filteredTokens
              .sort((a, b) => b.change - a.change)
              .map((token, i) => (
              <div key={i} className={`rounded-2xl border p-4 transition hover:border-white/20 ${
                token.change > 20 ? "border-green-500/20 bg-green-500/5" :
                token.change > 0 ? "border-white/10 bg-white/[0.04]" :
                "border-red-500/20 bg-red-500/5"
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{token.trend}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">{token.name}</span>
                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/40">{token.category}</span>
                      </div>
                      <p className="text-sm text-white/40">${token.price}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${token.change >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {token.change >= 0 ? "+" : ""}{token.change}%
                    </p>
                    <p className="text-xs text-white/30">24h</p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 mb-3">
                  <div className="rounded-xl bg-black/30 p-2 text-center">
                    <p className="text-xs text-white/30">Volume</p>
                    <p className="text-xs font-semibold">${token.volume}</p>
                  </div>
                  <div className="rounded-xl bg-black/30 p-2 text-center">
                    <p className="text-xs text-white/30">MCap</p>
                    <p className="text-xs font-semibold">${token.mcap}</p>
                  </div>
                  <div className="rounded-xl bg-black/30 p-2 text-center">
                    <p className="text-xs text-white/30">Liquidity</p>
                    <p className="text-xs font-semibold">${token.liquidity}</p>
                  </div>
                  <div className="rounded-xl bg-black/30 p-2 text-center">
                    <p className="text-xs text-white/30">Alpha</p>
                    <p className={`text-xs font-bold ${token.alpha >= 70 ? "text-green-400" : token.alpha >= 50 ? "text-yellow-400" : "text-red-400"}`}>
                      {token.alpha}/100
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    token.risk === "Low" ? "bg-green-500/20 text-green-400" :
                    token.risk === "Medium" ? "bg-yellow-500/20 text-yellow-400" :
                    token.risk === "High" ? "bg-orange-500/20 text-orange-400" :
                    "bg-red-500/20 text-red-400"
                  }`}>{token.risk} Risk</span>
                  <div className="h-1.5 w-24 rounded-full bg-white/10">
                    <div className={`h-1.5 rounded-full ${
                      token.alpha >= 70 ? "bg-green-500" : token.alpha >= 50 ? "bg-yellow-500" : "bg-red-500"
                    }`} style={{ width: `${token.alpha}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* New Launches */}
        {selectedTab === "new" && (
          <div className="space-y-3">
            <h2 className="text-xl font-semibold mb-2">🆕 New Launches (Last 24h)</h2>
            {DEMO_NEW_LAUNCHES.map((token, i) => (
              <div key={i} className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-lg">{token.name}</span>
                      <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-xs text-orange-400">🆕 {token.age}</span>
                    </div>
                    <p className="text-sm text-white/40">${token.price}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-400">+{token.change}%</p>
                    <p className="text-xs text-white/30">since launch</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="rounded-xl bg-black/30 p-2 text-center">
                    <p className="text-xs text-white/30">Liquidity</p>
                    <p className="text-xs font-semibold">${token.liquidity}</p>
                  </div>
                  <div className="rounded-xl bg-black/30 p-2 text-center">
                    <p className="text-xs text-white/30">Holders</p>
                    <p className="text-xs font-semibold">{token.holders}</p>
                  </div>
                  <div className="rounded-xl bg-black/30 p-2 text-center">
                    <p className="text-xs text-white/30">Alpha</p>
                    <p className={`text-xs font-bold ${token.alpha >= 50 ? "text-yellow-400" : "text-red-400"}`}>{token.alpha}/100</p>
                  </div>
                </div>

                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  token.risk === "Extreme" ? "bg-red-500/30 text-red-400" :
                  token.risk === "Very High" ? "bg-red-500/20 text-red-400" :
                  "bg-orange-500/20 text-orange-400"
                }`}>⚠️ {token.risk} Risk</span>
              </div>
            ))}
          </div>
        )}

        {/* AI Watchlist */}
        {selectedTab === "watchlist" && (
          <div className="space-y-3">
            <h2 className="text-xl font-semibold mb-2">👁️ AI Watchlist</h2>
            <p className="text-sm text-white/40 mb-4">Tokens AI is monitoring for potential setups. Ranked by Alpha Score.</p>
            {DEMO_TOKENS
              .sort((a, b) => b.alpha - a.alpha)
              .slice(0, 5)
              .map((token, i) => (
              <div key={i} className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-sm font-bold">{i + 1}</span>
                    <div>
                      <span className="font-bold">{token.name}</span>
                      <span className="ml-2 text-sm text-white/40">${token.price}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-purple-400">{token.alpha}</p>
                    <p className="text-xs text-white/30">Alpha Score</p>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-white/10">
                  <div className={`h-2 rounded-full ${
                    token.alpha >= 80 ? "bg-green-500" : token.alpha >= 60 ? "bg-purple-500" : "bg-yellow-500"
                  }`} style={{ width: `${token.alpha}%` }} />
                </div>
                <p className="mt-2 text-xs text-white/50">
                  {token.alpha >= 80 ? "Strong fundamentals, growing momentum, low risk relative to potential" :
                   token.alpha >= 60 ? "Decent setup forming, monitor for entry confirmation" :
                   "Watching for improvement in key metrics before recommending"}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* High Risk */}
        {selectedTab === "risk" && (
          <div className="space-y-3">
            <h2 className="text-xl font-semibold mb-2">⚠️ High Risk Tokens</h2>
            <p className="text-sm text-white/40 mb-4">Tokens with significant risk flags. Trade with extreme caution or avoid.</p>
            {DEMO_HIGH_RISK.map((token, i) => (
              <div key={i} className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-lg">{token.name}</span>
                  <span className="rounded-full bg-red-500/30 px-3 py-1 text-xs font-bold text-red-400">
                    {token.risk}
                  </span>
                </div>
                <p className="text-sm text-white/60 mb-3">{token.reason}</p>
                <div className="flex flex-wrap gap-2">
                  {token.flags.map((flag, j) => (
                    <span key={j} className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs text-red-400">
                      🚩 {flag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Smart Wallets */}
        {selectedTab === "wallets" && (
          <div className="space-y-3">
            <h2 className="text-xl font-semibold mb-2">🐋 Smart Wallet Activity</h2>
            <p className="text-sm text-white/40 mb-4">Tracking profitable wallets, whales, and insider-like activity.</p>
            {DEMO_WALLET_ACTIVITY.map((activity, i) => (
              <div key={i} className={`rounded-2xl border p-4 ${
                activity.action === "Bought" ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5"
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{activity.action === "Bought" ? "🟢" : "🔴"}</span>
                    <div>
                      <p className="font-semibold text-sm">
                        {activity.action} <span className="text-blue-400">{activity.token}</span>
                      </p>
                      <p className="text-xs text-white/30">{activity.wallet} · {activity.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${activity.action === "Bought" ? "text-green-400" : "text-red-400"}`}>
                      {activity.amount}
                    </p>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${
                      activity.type === "Smart Wallet" ? "bg-purple-500/20 text-purple-400" :
                      activity.type === "Whale" ? "bg-blue-500/20 text-blue-400" :
                      activity.type === "Insider" ? "bg-yellow-500/20 text-yellow-400" :
                      "bg-red-500/20 text-red-400"
                    }`}>{activity.type}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recently Reviewed */}
        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="mb-4 text-xl font-semibold">🕐 Recently Reviewed</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {DEMO_TOKENS.slice(0, 3).map((token, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold">{token.name}</span>
                  <span className={`text-sm font-bold ${token.alpha >= 70 ? "text-green-400" : "text-yellow-400"}`}>
                    {token.alpha}/100
                  </span>
                </div>
                <p className="text-xs text-white/40">${token.price} · {token.change >= 0 ? "+" : ""}{token.change}%</p>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
          <p className="text-xs text-white/20 text-center">
            ⚠️ PipTrak Alpha provides research data only. This is not financial advice. All scores are research rankings, not profit predictions.
            Never invest more than you can afford to lose. Demo data shown — real data integration coming soon.
          </p>
        </div>

      </div>
    </AppShell>
  );
}