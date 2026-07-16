"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";

type Pair = {
  pair: string;
  current_price: string;
  direction: string;
  confidence: number;
  reason: string;
  target: string;
  stop_loss: string;
  key_support: string;
  key_resistance: string;
  volatility: string;
  expected_range: string;
  best_time_cet: string;
};

type EventToday = {
  time: string;
  currency: string;
  event: string;
  impact: string;
  forecast: string;
  previous: string;
  expected_move: string;
  bias_direction?: string;
  bias_strength?: string;
  historical_note?: string;
  if_beats_forecast?: string;
  if_misses_forecast?: string;
};

type NewsItem = { source: string; title: string; url: string };

type Brief = {
  brief_date: string;
  brief_time: string;
  is_weekend: boolean;
  headline: string;
  market_mood: string;
  summary: string;
  key_theme: string;
  usd_bias: { direction: string; reasoning: string; confidence_note: string };
  hot_pairs: { pair: string; reason: string; expected_move: string; direction: string }[];
  pairs: Pair[];
  crypto_analysis: {
    sentiment: string;
    btc_dominance: string;
    btc_analysis: string;
    top_gainers: { symbol: string; price: string; change_24h: string; continue_probability: number; reason: string; trade_plan: string }[];
    top_losers: { symbol: string; price: string; change_24h: string; bounce_probability: number; reason: string }[];
    best_crypto_trade: string;
  };
  cot_report: { summary: string; positions: { pair: string; signal: string; insight: string }[] };
  correlations: { assets: string; relationship: string; meaning: string; action: string }[];
  events_today: EventToday[];
  best_setup: {
    asset: string;
    direction: string;
    entry: string;
    target: string;
    stop: string;
    risk_reward: string;
    confidence: number;
    reasoning: string;
    invalidation: string;
  };
  volatility_overview: {
    overall: string;
    hottest_asset: string;
    best_window_cet: string;
    avoid_window_cet: string;
    news_warning: string;
  };
  warnings: string[];
  action_items: string[];
  missing_pairs: string[];
  news_items: NewsItem[];
};

function clean(v: any) {
  return String(v ?? "").replace(/%/g, "");
}

export default function MorningBriefPage() {
  const [loading, setLoading] = useState(false);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [error, setError] = useState("");
  const [executing, setExecuting] = useState(false);
  const [tradeMsg, setTradeMsg] = useState("");

  async function generate() {
    setLoading(true);
    setError("");
    setBrief(null);
    setTradeMsg("");
    try {
      const response = await fetch("/api/morning-brief", { method: "POST" });
      const data = await response.json();
      if (data.error) setError(data.error);
      else setBrief(data);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function executeSetup() {
    if (!brief?.best_setup) return;
    const setup = brief.best_setup;

    if (String(setup.asset).toLowerCase().includes("none")) {
      setTradeMsg("No valid setup to execute today.");
      return;
    }

    const saved = localStorage.getItem("active_account");
    if (!saved) {
      setTradeMsg("Set an active account on the Accounts page first.");
      return;
    }

    const account = JSON.parse(saved);
    setExecuting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const res = await fetch("/api/mt5/signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          account: account.account_number,
          symbol: setup.asset.replace("/", ""),
          trade_type: setup.direction === "Buy" ? "BUY" : "SELL",
          lot_size: 0.01,
          stop_loss_pips: 30,
          take_profit_pips: 60,
        }),
      });

      const data = await res.json();
      if (data.success) setTradeMsg(`✅ Signal sent — ${setup.direction} ${setup.asset} executing in MT5`);
      else setTradeMsg("Error: " + data.error);
    } catch (err) {
      setTradeMsg("Error: " + String(err));
    } finally {
      setExecuting(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <p className="w-fit rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1 text-sm text-blue-300">
              🌅 Morning Brief
            </p>
            <span className="rounded-full border border-green-500/30 bg-green-500/10 px-3 py-0.5 text-xs text-green-400">
              LIVE PRICES
            </span>
          </div>
          <h1 className="text-4xl font-bold">Daily Market Intelligence</h1>
          <p className="mt-1 text-sm text-blue-400">
            📅 {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "Europe/Vienna" })}
            {" · "}
            🕐 {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Europe/Vienna" })} CET
          </p>
          <p className="mt-2 text-white/40">
            7 forex pairs · crypto · COT context · correlations · events. Real prices only, cited sources, no invented numbers.
          </p>
        </div>

        <button
          onClick={generate}
          disabled={loading}
          className="mb-8 w-full rounded-2xl bg-blue-600 py-4 text-lg font-semibold transition hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "🤖 Fetching live prices, crypto & news... (~45s)" : "🌅 Generate Morning Brief"}
        </button>

        {loading && (
          <p className="mb-6 text-center text-xs text-white/30">
            Forex prices are fetched one at a time to respect API limits. Please wait.
          </p>
        )}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-400 text-sm">{error}</div>
        )}

        {brief && (
          <div className="space-y-6">

            {brief.is_weekend && (
              <div className="rounded-3xl border border-yellow-500/30 bg-yellow-500/5 p-5">
                <p className="text-sm text-yellow-300">🛌 Forex markets are closed for the weekend. Crypto analysis only today.</p>
              </div>
            )}

            {brief.missing_pairs?.length > 0 && !brief.is_weekend && (
              <div className="rounded-3xl border border-orange-500/30 bg-orange-500/5 p-5">
                <p className="text-sm text-orange-300">
                  ⚠️ Live price unavailable for: <strong>{brief.missing_pairs.join(", ")}</strong>.
                  These are excluded rather than guessed.
                </p>
              </div>
            )}

            {/* Headline */}
            <div className="rounded-3xl border border-blue-500/30 bg-blue-500/5 p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-white/40">{brief.brief_date} · {brief.brief_time}</p>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                  brief.market_mood === "Risk-On" ? "bg-green-500/20 text-green-400" :
                  brief.market_mood === "Risk-Off" ? "bg-red-500/20 text-red-400" :
                  "bg-yellow-500/20 text-yellow-400"
                }`}>{brief.market_mood}</span>
              </div>
              <h2 className="text-2xl font-bold mb-3">{brief.headline}</h2>
              <p className="text-sm text-white/70 leading-relaxed mb-4">{brief.summary}</p>
              <div className="rounded-2xl border border-blue-500/20 bg-black/30 p-3">
                <p className="text-xs text-blue-400 font-semibold mb-1">🎯 Key Theme</p>
                <p className="text-sm text-white/70">{brief.key_theme}</p>
              </div>
            </div>

            {/* USD Bias */}
            {brief.usd_bias && (
              <div className="rounded-3xl border border-purple-500/20 bg-purple-500/5 p-6">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <h2 className="text-xl font-semibold text-purple-400">💵 USD Bias Today</h2>
                  <span className={`rounded-full px-3 py-1 text-sm font-bold ${
                    brief.usd_bias.direction?.toLowerCase().includes("bull") ? "bg-green-500/20 text-green-400" :
                    brief.usd_bias.direction?.toLowerCase().includes("bear") ? "bg-red-500/20 text-red-400" :
                    "bg-yellow-500/20 text-yellow-400"
                  }`}>{brief.usd_bias.direction}</span>
                </div>
                <p className="text-sm text-white/70 mb-3">{brief.usd_bias.reasoning}</p>
                <div className="rounded-2xl bg-black/30 p-3">
                  <p className="text-xs text-white/50">{brief.usd_bias.confidence_note}</p>
                </div>
              </div>
            )}

            {/* Hot Pairs */}
            {brief.hot_pairs?.length > 0 && (
              <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-6">
                <h2 className="mb-4 text-xl font-semibold text-red-400">🔥 Hottest Today</h2>
                <div className="space-y-3">
                  {brief.hot_pairs.map((hp, i) => (
                    <div key={i} className="flex items-center justify-between rounded-2xl border border-red-500/20 bg-black/30 p-4">
                      <div>
                        <p className="font-bold text-lg">{hp.pair}</p>
                        <p className="text-xs text-white/60">{hp.reason}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${hp.direction === "Bullish" ? "text-green-400" : "text-red-400"}`}>
                          {hp.direction === "Bullish" ? "↑" : "↓"} {hp.direction}
                        </p>
                        <p className="text-xs text-yellow-400">{hp.expected_move}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Volatility */}
            {brief.volatility_overview && (
              <div className="rounded-3xl border border-orange-500/20 bg-orange-500/5 p-6">
                <h2 className="mb-4 text-xl font-semibold text-orange-400">⚡ Volatility Overview</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-xs text-white/40">Overall</p>
                    <p className={`text-xl font-bold mt-1 ${
                      brief.volatility_overview.overall === "High" ? "text-red-400" :
                      brief.volatility_overview.overall === "Medium" ? "text-yellow-400" : "text-green-400"
                    }`}>{brief.volatility_overview.overall}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-xs text-white/40">Best Window</p>
                    <p className="text-sm font-bold mt-1 text-green-400">{brief.volatility_overview.best_window_cet}</p>
                  </div>
                </div>
                {brief.volatility_overview.hottest_asset && (
                  <div className="mt-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-3">
                    <p className="text-xs text-red-400">🔥 Hottest: {brief.volatility_overview.hottest_asset}</p>
                  </div>
                )}
                {brief.volatility_overview.avoid_window_cet && (
                  <div className="mt-3 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-3">
                    <p className="text-xs text-yellow-400">⚠️ Avoid: {brief.volatility_overview.avoid_window_cet}</p>
                  </div>
                )}
                {brief.volatility_overview.news_warning && (
                  <div className="mt-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-3">
                    <p className="text-xs text-red-400">📰 {brief.volatility_overview.news_warning}</p>
                  </div>
                )}
              </div>
            )}

            {/* Events */}
            {brief.events_today?.length > 0 && (
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                <h2 className="mb-4 text-xl font-semibold">📅 Today's Events (CET)</h2>
                <div className="space-y-3">
                  {brief.events_today.map((evt, i) => (
                    <div key={i} className={`rounded-2xl border p-3 ${
                      evt.impact === "High" ? "border-red-500/20 bg-red-500/5" : "border-yellow-500/20 bg-yellow-500/5"
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                            evt.impact === "High" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"
                          }`}>{evt.impact}</span>
                          <span className="text-sm font-semibold">{evt.time}</span>
                          <span className="text-sm text-blue-400">{evt.currency}</span>
                          <span className="text-sm">{evt.event}</span>
                        </div>
                        <span className="text-xs text-white/40">{evt.expected_move}</span>
                      </div>
                      <p className="text-xs text-white/40 mb-2">Forecast: {evt.forecast} · Previous: {evt.previous}</p>

                      {evt.bias_direction && (
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                            evt.bias_direction.toLowerCase().includes("bull") ? "bg-green-500/20 text-green-400" :
                            evt.bias_direction.toLowerCase().includes("bear") ? "bg-red-500/20 text-red-400" :
                            "bg-yellow-500/20 text-yellow-400"
                          }`}>📊 Bias: {evt.bias_direction}</span>
                          {evt.bias_strength && (
                            <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/50">{evt.bias_strength}</span>
                          )}
                        </div>
                      )}

                      {evt.historical_note && (
                        <div className="rounded-xl bg-black/30 p-3">
                          <p className="text-xs text-purple-400 font-semibold mb-1">📚 Historically</p>
                          <p className="text-xs text-white/60">{evt.historical_note}</p>
                          <p className="text-[10px] text-white/30 mt-2">General tendency, not a prediction or guarantee.</p>
                        </div>
                      )}

                      {(evt.if_beats_forecast || evt.if_misses_forecast) && (
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          {evt.if_beats_forecast && (
                            <div className="rounded-xl border border-green-500/10 bg-green-500/5 p-3">
                              <p className="text-xs text-green-400 font-semibold mb-1">If beats forecast</p>
                              <p className="text-xs text-white/60">{evt.if_beats_forecast}</p>
                            </div>
                          )}
                          {evt.if_misses_forecast && (
                            <div className="rounded-xl border border-red-500/10 bg-red-500/5 p-3">
                              <p className="text-xs text-red-400 font-semibold mb-1">If misses forecast</p>
                              <p className="text-xs text-white/60">{evt.if_misses_forecast}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pairs */}
            {brief.pairs?.length > 0 && (
              <div className="rounded-3xl border border-green-500/20 bg-green-500/5 p-6">
                <h2 className="mb-4 text-xl font-semibold text-green-400">💱 Forex Analysis</h2>
                <div className="space-y-3">
                  {brief.pairs.map((p, i) => (
                    <div key={i} className={`rounded-2xl border p-4 ${
                      p.direction === "Bullish" ? "border-green-500/20 bg-green-500/5" :
                      p.direction === "Bearish" ? "border-red-500/20 bg-red-500/5" :
                      "border-yellow-500/20 bg-yellow-500/5"
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold">{p.pair}</span>
                          <span className="text-sm text-white/40">{p.current_price}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${
                            p.direction === "Bullish" ? "text-green-400" :
                            p.direction === "Bearish" ? "text-red-400" : "text-yellow-400"
                          }`}>{p.direction}</span>
                          {p.confidence != null && (
                            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">{clean(p.confidence)}%</span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="rounded-xl bg-black/30 p-2 text-center">
                          <p className="text-xs text-white/30">Target</p>
                          <p className="text-sm font-bold text-green-400">{p.target}</p>
                        </div>
                        <div className="rounded-xl bg-black/30 p-2 text-center">
                          <p className="text-xs text-white/30">Stop</p>
                          <p className="text-sm font-bold text-red-400">{p.stop_loss}</p>
                        </div>
                        <div className="rounded-xl bg-black/30 p-2 text-center">
                          <p className="text-xs text-white/30">Range</p>
                          <p className="text-sm font-bold text-yellow-400">{p.expected_range}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                          p.volatility === "High" ? "bg-red-500/20 text-red-400" :
                          p.volatility === "Medium" ? "bg-yellow-500/20 text-yellow-400" :
                          "bg-green-500/20 text-green-400"
                        }`}>{p.volatility} volatility</span>
                        <span className="text-xs text-white/30">🕐 {p.best_time_cet}</span>
                      </div>

                      <p className="text-xs text-white/40 mb-1">S: {p.key_support} · R: {p.key_resistance}</p>
                      <p className="text-xs text-white/60">{p.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Crypto */}
            {brief.crypto_analysis && (
              <div className="rounded-3xl border border-yellow-500/20 bg-yellow-500/5 p-6">
                <h2 className="mb-4 text-xl font-semibold text-yellow-400">🪙 Crypto Analysis</h2>

                <div className="grid gap-3 sm:grid-cols-2 mb-4">
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                    <p className="text-xs text-white/40">Sentiment</p>
                    <p className={`text-lg font-bold mt-1 ${
                      brief.crypto_analysis.sentiment === "Bullish" ? "text-green-400" :
                      brief.crypto_analysis.sentiment === "Bearish" ? "text-red-400" : "text-yellow-400"
                    }`}>{brief.crypto_analysis.sentiment}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                    <p className="text-xs text-white/40">BTC Dominance</p>
                    <p className="text-lg font-bold mt-1 text-orange-400">{clean(brief.crypto_analysis.btc_dominance)}%</p>
                  </div>
                </div>

                <div className="mb-4 rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="text-xs text-orange-400 font-semibold mb-1">₿ BTC</p>
                  <p className="text-sm text-white/70">{brief.crypto_analysis.btc_analysis}</p>
                </div>

                {brief.crypto_analysis.top_gainers?.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-green-400 mb-3">📈 Top Gainers</p>
                    <div className="space-y-3">
                      {brief.crypto_analysis.top_gainers.map((g, i) => (
                        <div key={i} className="rounded-2xl border border-green-500/20 bg-green-500/5 p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-bold">{g.symbol}</span>
                              <span className="text-sm text-white/40">${clean(g.price)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-green-400 font-bold">{clean(g.change_24h)}%</span>
                              <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs text-blue-400">
                                {clean(g.continue_probability)}% continue
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-white/60 mb-1">{g.reason}</p>
                          <p className="text-xs text-yellow-400">📋 {g.trade_plan}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {brief.crypto_analysis.top_losers?.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-red-400 mb-3">📉 Top Losers</p>
                    <div className="space-y-3">
                      {brief.crypto_analysis.top_losers.map((l, i) => (
                        <div key={i} className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-bold">{l.symbol}</span>
                              <span className="text-sm text-white/40">${clean(l.price)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-red-400 font-bold">{clean(l.change_24h)}%</span>
                              <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs text-yellow-400">
                                {clean(l.bounce_probability)}% bounce
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-white/60">{l.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {brief.crypto_analysis.best_crypto_trade && (
                  <div className="rounded-2xl border border-yellow-500/20 bg-black/30 p-3">
                    <p className="text-xs text-yellow-400 font-semibold mb-1">🏆 Best Crypto Trade</p>
                    <p className="text-sm text-white/70">{brief.crypto_analysis.best_crypto_trade}</p>
                  </div>
                )}
              </div>
            )}

            {/* COT */}
            {brief.cot_report && (
              <div className="rounded-3xl border border-purple-500/20 bg-purple-500/5 p-6">
                <h2 className="mb-2 text-xl font-semibold text-purple-400">🏦 Institutional Context</h2>
                <p className="text-sm text-white/50 mb-4">{brief.cot_report.summary}</p>
                <div className="space-y-2">
                  {brief.cot_report.positions?.map((pos, i) => (
                    <div key={i} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 p-3">
                      <div>
                        <p className="font-bold text-sm">{pos.pair}</p>
                        <p className="text-xs text-white/40">{pos.insight}</p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        pos.signal === "Bullish" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                      }`}>{pos.signal}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Correlations */}
            {brief.correlations?.length > 0 && (
              <div className="rounded-3xl border border-yellow-500/20 bg-yellow-500/5 p-6">
                <h2 className="mb-4 text-xl font-semibold text-yellow-400">🔗 Correlations</h2>
                <div className="space-y-2">
                  {brief.correlations.map((c, i) => (
                    <div key={i} className="rounded-2xl border border-white/10 bg-black/30 p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-bold text-sm">{c.assets}</p>
                        <span className="text-xs text-white/40">{c.relationship}</span>
                      </div>
                      <p className="text-xs text-white/60">{c.meaning}</p>
                      <p className="text-xs text-blue-400 mt-1">→ {c.action}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Best Setup */}
            {brief.best_setup && (
              <div className="rounded-3xl border border-green-500/20 bg-green-500/5 p-6">
                <h2 className="mb-4 text-xl font-semibold text-green-400">⭐ Best Setup Today</h2>
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="text-xl font-bold">{brief.best_setup.asset}</span>
                  {!String(brief.best_setup.asset).toLowerCase().includes("none") && (
                    <>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                        brief.best_setup.direction === "Buy" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                      }`}>{brief.best_setup.direction}</span>
                      {brief.best_setup.confidence != null && (
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs">{clean(brief.best_setup.confidence)}%</span>
                      )}
                    </>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="rounded-xl bg-black/30 p-2 text-center">
                    <p className="text-xs text-white/30">Entry</p>
                    <p className="text-sm font-bold">{brief.best_setup.entry}</p>
                  </div>
                  <div className="rounded-xl bg-black/30 p-2 text-center">
                    <p className="text-xs text-white/30">Target</p>
                    <p className="text-sm font-bold text-green-400">{brief.best_setup.target}</p>
                  </div>
                  <div className="rounded-xl bg-black/30 p-2 text-center">
                    <p className="text-xs text-white/30">Stop</p>
                    <p className="text-sm font-bold text-red-400">{brief.best_setup.stop}</p>
                  </div>
                </div>

                <p className="text-xs text-white/40 mb-2">R:R {brief.best_setup.risk_reward}</p>
                <p className="text-sm text-white/60 mb-3">{brief.best_setup.reasoning}</p>

                <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-3 mb-3">
                  <p className="text-xs text-yellow-400">⚠️ Invalidation: {brief.best_setup.invalidation}</p>
                </div>

                {tradeMsg && (
                  <div className={`mb-3 rounded-xl p-2 text-xs ${
                    tradeMsg.startsWith("✅") ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                  }`}>{tradeMsg}</div>
                )}

                {!brief.is_weekend && !String(brief.best_setup.asset).toLowerCase().includes("none") && (
                  <button
                    onClick={executeSetup}
                    disabled={executing}
                    className="w-full rounded-xl bg-green-600 py-2.5 text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50"
                  >
                    {executing ? "Sending..." : `⚡ Execute ${brief.best_setup.direction} ${brief.best_setup.asset} in MT5`}
                  </button>
                )}
              </div>
            )}

            {/* Warnings */}
            {brief.warnings?.length > 0 && (
              <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-6">
                <h2 className="mb-3 text-xl font-semibold text-red-400">⚠️ Today's Risks</h2>
                <div className="space-y-2">
                  {brief.warnings.map((w, i) => (
                    <p key={i} className="text-sm text-white/70">• {w}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Action Items */}
            {brief.action_items?.length > 0 && (
              <div className="rounded-3xl border border-blue-500/20 bg-blue-500/5 p-6">
                <h2 className="mb-4 text-xl font-semibold text-blue-400">✅ Action Items</h2>
                <div className="space-y-2">
                  {brief.action_items.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-xl bg-white/5 p-3">
                      <span className="text-blue-400 font-bold">{i + 1}.</span>
                      <p className="text-sm text-white/70">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sources */}
            {brief.news_items?.length > 0 && (
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                <h2 className="mb-4 text-xl font-semibold">📰 News Sources Used Today</h2>
                <div className="space-y-2">
                  {brief.news_items.map((item, i) => (
                    <a key={i} href={item.url} target="_blank" rel="noopener noreferrer" className="block rounded-2xl border border-white/10 bg-black/30 p-3 hover:border-white/20 transition">
                      <p className="text-xs text-blue-400 mb-1">{item.source}</p>
                      <p className="text-sm text-white/70">{item.title}</p>
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
              <p className="text-xs text-white/20 text-center">
                ⚠️ Research only, not financial advice. Prices are live at generation time.
                Historical notes are general tendencies, not predictions. Institutional context is general reasoning, not live COT data.
                AI analysis can be wrong. Verify independently.
              </p>
            </div>

          </div>
        )}
      </div>
    </AppShell>
  );
}