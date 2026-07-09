"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";

type NewsEvent = {
  time: string;
  currency: string;
  event: string;
  impact: "High" | "Medium" | "Low";
  forecast: string;
  previous: string;
};

type PairBias = {
  direction: string;
  confidence: number;
  current_price: string;
  target: string;
  reason: string;
};

type EventAnalysis = {
  event: string;
  currency: string;
  if_beats: { direction: string; probability: number; avg_pips: number; pairs_affected: string[] };
  if_misses: { direction: string; probability: number; avg_pips: number; pairs_affected: string[] };
  trade_plan: string;
  historical_note: string;
};

type CoinAnalysis = {
  coin: string;
  current_price: string;
  direction: string;
  probability: number;
  target: string;
  move_percent: string;
  reason: string;
  community_buzz: string;
  category: string;
};

type CryptoAnalysis = {
  market_sentiment: string;
  fear_greed: string;
  btc_analysis: string;
  best_coins_today: CoinAnalysis[];
  coins_to_avoid: string[];
  meme_coin_alert: string;
  crypto_trade_plan: string;
};
type PairVolatility = {
  rating: string;
  score: number;
  expected_range: string;
  best_time: string;
};

type VolatilityAnalysis = {
  overall_volatility: string;
  vix_estimate: string;
  best_trading_window: string;
  avoid_times: string;
  pairs_volatility: Record<string, PairVolatility>;
  news_impact: string;
  recommendation: string;
};
type Analysis = {
  analysis_date: string;
  overall_bias: Record<string, PairBias>;
  event_analysis: EventAnalysis[];
  warning: string;
  best_pairs_to_trade: string[];
  pairs_to_avoid: string[];
  key_levels: Record<string, string>;
  market_context: string;
  crypto_analysis: CryptoAnalysis;
  dxy_analysis: string;
  institutional_flow: string;
  smart_money_summary: string;
  volatility_analysis: VolatilityAnalysis;
};

export default function MarketAnalysisPage() {
  const [events, setEvents] = useState<NewsEvent[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingNews, setFetchingNews] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [executeMessage, setExecuteMessage] = useState("");
  const [newEvent, setNewEvent] = useState<NewsEvent>({
    time: "", currency: "USD", event: "", impact: "High", forecast: "", previous: ""
  });
  const [tradeForm, setTradeForm] = useState({
    symbol: "EURUSD",
    type: "BUY",
    lot: 0.01,
    sl: 30,
    tp: 60,
    account: "",
  });

  async function fetchTodaysNews() {
    setFetchingNews(true);
    try {
      const response = await fetch("/api/economic-calendar");
      const data = await response.json();
      if (data.events && data.events.length > 0) {
        setEvents(data.events);
      }
    } catch (err) {
      console.error("Failed to fetch news:", err);
    } finally {
      setFetchingNews(false);
    }
  }

  async function executeTradeSignal() {
    if (!tradeForm.account) {
      setExecuteMessage("Please enter your MT5 account number.");
      return;
    }
    setExecuting(true);
    setExecuteMessage("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await fetch("/api/mt5/signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          account: tradeForm.account,
          symbol: tradeForm.symbol,
          trade_type: tradeForm.type,
          lot_size: tradeForm.lot,
          stop_loss_pips: tradeForm.sl,
          take_profit_pips: tradeForm.tp,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setExecuteMessage(`✅ Signal sent! MT5 will execute ${tradeForm.type} ${tradeForm.symbol} within 30 seconds.`);
      } else {
        setExecuteMessage("Error: " + data.error);
      }
    } catch (err) {
      setExecuteMessage("Error: " + String(err));
    } finally {
      setExecuting(false);
    }
  }

  async function analyze() {
    setLoading(true);
    setAnalysis(null);
    try {
      const response = await fetch("/api/market-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events }),
      });
      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function addEvent() {
    if (!newEvent.event || !newEvent.time) return;
    setEvents([...events, newEvent]);
    setNewEvent({ time: "", currency: "USD", event: "", impact: "High", forecast: "", previous: "" });
  }

  function removeEvent(index: number) {
    setEvents(events.filter((_, i) => i !== index));
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-8">
          <p className="mb-3 w-fit rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1 text-sm text-green-300">
            AI Market Analysis
          </p>
          <h1 className="text-4xl font-bold">Daily Market Analysis</h1>
          <p className="mt-1 text-sm text-blue-400">
            📅 {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
          <p className="mt-2 text-white/40">
            AI scans real news, institutional flow, and smart money positioning to give you today's market intelligence.
          </p>
        </div>

        {/* Add Events */}
        <div className="mb-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="mb-4 text-xl font-semibold">Today's Economic Events</h2>

          <button
            onClick={fetchTodaysNews}
            disabled={fetchingNews}
            className="mb-4 w-full rounded-2xl border border-blue-500/20 bg-blue-500/10 py-3 text-sm font-semibold text-blue-400 hover:bg-blue-500/20 transition disabled:opacity-50"
          >
            {fetchingNews ? "Fetching today's events..." : "🔄 Load Today's Economic Calendar"}
          </button>

          <div className="mb-4 space-y-2">
            {events.length === 0 && (
              <p className="text-center text-sm text-white/30 py-4">
                Click above to load today's events, or add manually. AI will also scan today's news automatically.
              </p>
            )}
            {events.map((e, i) => (
              <div key={i} className={`flex items-center justify-between rounded-2xl border p-3 ${
                e.impact === "High" ? "border-red-500/20 bg-red-500/5" :
                e.impact === "Medium" ? "border-yellow-500/20 bg-yellow-500/5" :
                "border-white/10 bg-white/5"
              }`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    e.impact === "High" ? "bg-red-500/20 text-red-400" :
                    e.impact === "Medium" ? "bg-yellow-500/20 text-yellow-400" :
                    "bg-white/10 text-white/40"
                  }`}>{e.impact}</span>
                  <span className="text-sm font-semibold">{e.time}</span>
                  <span className="text-sm text-blue-400">{e.currency}</span>
                  <span className="text-sm">{e.event}</span>
                  <span className="text-xs text-white/40">F: {e.forecast} P: {e.previous}</span>
                </div>
                <button onClick={() => removeEvent(i)} className="text-xs text-red-400 hover:text-red-300 ml-2">✕</button>
              </div>
            ))}
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <input value={newEvent.time} onChange={e => setNewEvent({...newEvent, time: e.target.value})}
              placeholder="Time e.g. 08:30" className="rounded-xl border border-white/10 bg-black/50 p-3 text-sm text-white outline-none focus:border-blue-500" />
            <select value={newEvent.currency} onChange={e => setNewEvent({...newEvent, currency: e.target.value})}
              className="rounded-xl border border-white/10 bg-black/50 p-3 text-sm text-white outline-none">
              {["USD", "EUR", "GBP", "JPY", "CHF", "AUD", "CAD", "NZD"].map(c => <option key={c}>{c}</option>)}
            </select>
            <input value={newEvent.event} onChange={e => setNewEvent({...newEvent, event: e.target.value})}
              placeholder="Event name" className="rounded-xl border border-white/10 bg-black/50 p-3 text-sm text-white outline-none focus:border-blue-500" />
            <input value={newEvent.forecast} onChange={e => setNewEvent({...newEvent, forecast: e.target.value})}
              placeholder="Forecast" className="rounded-xl border border-white/10 bg-black/50 p-3 text-sm text-white outline-none" />
            <input value={newEvent.previous} onChange={e => setNewEvent({...newEvent, previous: e.target.value})}
              placeholder="Previous" className="rounded-xl border border-white/10 bg-black/50 p-3 text-sm text-white outline-none" />
            <select value={newEvent.impact} onChange={e => setNewEvent({...newEvent, impact: e.target.value as any})}
              className="rounded-xl border border-white/10 bg-black/50 p-3 text-sm text-white outline-none">
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </div>
          <button onClick={addEvent} className="mt-3 rounded-xl bg-white/10 px-4 py-2 text-sm hover:bg-white/20 transition">
            + Add Event Manually
          </button>
        </div>

        <button
          onClick={analyze}
          disabled={loading}
          className="mb-8 w-full rounded-2xl bg-green-600 py-4 text-lg font-semibold transition hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? "🤖 Scanning News, Prices & Smart Money Flow..." : "🤖 Generate Full Market Intelligence"}
        </button>

        {analysis && (
          <div className="space-y-6">

            {/* Date */}
            {analysis.analysis_date && (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/40">
                📅 Analysis for: {analysis.analysis_date}
              </div>
            )}

            {/* Market Context */}
            {analysis.market_context && (
              <div className="rounded-3xl border border-blue-500/20 bg-blue-500/5 p-5">
                <p className="text-sm font-semibold text-blue-400 mb-2">📰 Today's Market Context</p>
                <p className="text-sm text-white/70 leading-relaxed">{analysis.market_context}</p>
              </div>
            )}

            {/* Smart Money */}
            {analysis.smart_money_summary && (
              <div className="rounded-3xl border border-purple-500/20 bg-purple-500/5 p-5">
                <p className="text-sm font-semibold text-purple-400 mb-2">🏦 Smart Money Analysis</p>
                <p className="text-sm text-white/70 leading-relaxed">{analysis.smart_money_summary}</p>
              </div>
            )}

            {/* DXY */}
            {analysis.dxy_analysis && (
              <div className="rounded-3xl border border-yellow-500/20 bg-yellow-500/5 p-5">
                <p className="text-sm font-semibold text-yellow-400 mb-2">💵 DXY Analysis</p>
                <p className="text-sm text-white/70 leading-relaxed">{analysis.dxy_analysis}</p>
              </div>
            )}

            {/* Institutional Flow */}
            {analysis.institutional_flow && (
              <div className="rounded-3xl border border-green-500/20 bg-green-500/5 p-5">
                <p className="text-sm font-semibold text-green-400 mb-2">🏛️ Institutional Flow</p>
                <p className="text-sm text-white/70 leading-relaxed">{analysis.institutional_flow}</p>
              </div>
            )}

            {/* Warning */}
            {analysis.warning && (
              <div className="rounded-3xl border border-yellow-500/20 bg-yellow-500/5 p-5">
                <p className="font-semibold text-yellow-400">⚠️ {analysis.warning}</p>
              </div>
            )}

            {/* Best/Avoid pairs */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-green-500/20 bg-green-500/5 p-5">
                <p className="mb-3 text-sm font-semibold text-green-400">✅ Best to Trade</p>
                <div className="flex flex-wrap gap-2">
                  {analysis.best_pairs_to_trade?.map(p => (
                    <span key={p} className="rounded-full bg-green-500/20 px-3 py-1 text-sm text-green-300">{p}</span>
                  ))}
                </div>
              </div>
              <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-5">
                <p className="mb-3 text-sm font-semibold text-red-400">❌ Avoid Today</p>
                <div className="flex flex-wrap gap-2">
                  {analysis.pairs_to_avoid?.map(p => (
                    <span key={p} className="rounded-full bg-red-500/20 px-3 py-1 text-sm text-red-300">{p}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Overall Bias */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <h2 className="mb-4 text-xl font-semibold">Today's Market Bias</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {Object.entries(analysis.overall_bias || {}).map(([pair, bias]) => (
                  <div key={pair} className={`rounded-2xl border p-4 ${
                    bias.direction === "Bullish" ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5"
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold">{pair}</p>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${bias.direction === "Bullish" ? "text-green-400" : "text-red-400"}`}>
                          {bias.direction === "Bullish" ? "↑" : "↓"} {bias.direction}
                        </span>
                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">{bias.confidence}%</span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 mb-2">
                      <div className={`h-2 rounded-full ${bias.direction === "Bullish" ? "bg-green-500" : "bg-red-500"}`}
                        style={{ width: `${bias.confidence}%` }} />
                    </div>
                    {bias.current_price && (
                      <div className="flex gap-3 text-xs text-white/40 mb-1">
                        <span>Now: {bias.current_price}</span>
                        {bias.target && <span>→ Target: {bias.target}</span>}
                      </div>
                    )}
                    <p className="text-xs text-white/50">{bias.reason}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Levels */}
            {analysis.key_levels && Object.keys(analysis.key_levels).length > 0 && (
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                <h2 className="mb-4 text-xl font-semibold">🎯 Key Levels Today</h2>
                <div className="space-y-3">
                  {Object.entries(analysis.key_levels).map(([pair, levels]) => (
                    <div key={pair} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <p className="font-semibold text-blue-400 mb-1">{pair}</p>
                      <p className="text-sm text-white/60">{levels}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Crypto Analysis */}
            {analysis.crypto_analysis && (
              <div className="rounded-3xl border border-yellow-500/20 bg-yellow-500/5 p-6">
                <h2 className="mb-4 text-xl font-semibold">🪙 Crypto Market Analysis</h2>

                <div className="grid gap-3 sm:grid-cols-2 mb-4">
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-sm text-white/40">Sentiment</p>
                    <p className={`text-xl font-bold mt-1 ${
                      analysis.crypto_analysis.market_sentiment === "Bullish" ? "text-green-400" :
                      analysis.crypto_analysis.market_sentiment === "Bearish" ? "text-red-400" :
                      "text-yellow-400"
                    }`}>{analysis.crypto_analysis.market_sentiment}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-sm text-white/40">Fear & Greed</p>
                    <p className="text-xl font-bold mt-1 text-yellow-400">{analysis.crypto_analysis.fear_greed}</p>
                  </div>
                </div>

                {analysis.crypto_analysis.btc_analysis && (
                  <div className="mb-4 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4">
                    <p className="text-sm font-semibold text-orange-400 mb-1">₿ BTC Analysis</p>
                    <p className="text-sm text-white/70">{analysis.crypto_analysis.btc_analysis}</p>
                  </div>
                )}

                {analysis.crypto_analysis.meme_coin_alert && (
                  <div className="mb-4 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4">
                    <p className="text-sm font-semibold text-orange-400 mb-1">🔥 Meme Coin Alert</p>
                    <p className="text-sm text-white/70">{analysis.crypto_analysis.meme_coin_alert}</p>
                  </div>
                )}

                <h3 className="mb-3 font-semibold text-yellow-400">Best Coins Today</h3>
                <div className="space-y-3 mb-4">
                  {analysis.crypto_analysis.best_coins_today?.map((coin, i) => (
                    <div key={i} className={`rounded-2xl border p-4 ${
                      coin.direction === "Bullish" ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5"
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-lg">{coin.coin}</span>
                          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/40">{coin.category}</span>
                          <span className="text-sm text-white/40">{coin.current_price}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${coin.direction === "Bullish" ? "text-green-400" : "text-red-400"}`}>
                            {coin.move_percent}
                          </span>
                          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">{coin.probability}%</span>
                        </div>
                      </div>
                      <p className="text-xs text-white/40 mb-1">Target: {coin.target}</p>
                      <p className="text-xs text-white/60 mb-1">{coin.reason}</p>
                      <p className="text-xs text-yellow-400">💬 {coin.community_buzz}</p>
                    </div>
                  ))}
                </div>

                {analysis.crypto_analysis.crypto_trade_plan && (
                  <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-4">
                    <p className="text-sm font-semibold text-yellow-400 mb-1">📋 Crypto Trade Plan</p>
                    <p className="text-sm text-white/80">{analysis.crypto_analysis.crypto_trade_plan}</p>
                  </div>
                )}
              </div>
            )}
{/* Volatility Analysis */}
            {analysis.volatility_analysis && (
              <div className="rounded-3xl border border-orange-500/20 bg-orange-500/5 p-6">
                <h2 className="mb-4 text-xl font-semibold text-orange-400">⚡ Volatility Analysis</h2>

                <div className="grid gap-3 sm:grid-cols-3 mb-4">
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-sm text-white/40">Overall Volatility</p>
                    <p className={`text-xl font-bold mt-1 ${
                      analysis.volatility_analysis.overall_volatility === "High" ? "text-red-400" :
                      analysis.volatility_analysis.overall_volatility === "Medium" ? "text-yellow-400" :
                      "text-green-400"
                    }`}>{analysis.volatility_analysis.overall_volatility}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-sm text-white/40">VIX Estimate</p>
                    <p className="text-xl font-bold mt-1 text-blue-400">{analysis.volatility_analysis.vix_estimate}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-sm text-white/40">Best Trading Window</p>
                    <p className="text-sm font-bold mt-1 text-green-400">{analysis.volatility_analysis.best_trading_window}</p>
                  </div>
                </div>

                {/* Pair volatility meters */}
                <div className="space-y-3 mb-4">
                  {Object.entries(analysis.volatility_analysis.pairs_volatility || {}).map(([pair, vol]) => (
                    <div key={pair} className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <p className="font-bold">{pair}</p>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                            vol.rating === "High" || vol.rating === "Extreme" ? "bg-red-500/20 text-red-400" :
                            vol.rating === "Medium" ? "bg-yellow-500/20 text-yellow-400" :
                            "bg-green-500/20 text-green-400"
                          }`}>{vol.rating}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-white/70">{vol.expected_range}</p>
                          <p className="text-xs text-white/30">{vol.best_time}</p>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-white/10">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            vol.score >= 80 ? "bg-red-500" :
                            vol.score >= 60 ? "bg-yellow-500" :
                            "bg-green-500"
                          }`}
                          style={{ width: `${vol.score}%` }}
                        />
                      </div>
                      <p className="text-xs text-white/30 mt-1">Volatility score: {vol.score}/100</p>
                    </div>
                  ))}
                </div>

                {analysis.volatility_analysis.news_impact && (
                  <div className="mb-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
                    <p className="text-sm font-semibold text-red-400 mb-1">📰 News Impact</p>
                    <p className="text-sm text-white/70">{analysis.volatility_analysis.news_impact}</p>
                  </div>
                )}

                {analysis.volatility_analysis.avoid_times && (
                  <div className="mb-3 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-4">
                    <p className="text-sm font-semibold text-yellow-400 mb-1">⚠️ Avoid Trading</p>
                    <p className="text-sm text-white/70">{analysis.volatility_analysis.avoid_times}</p>
                  </div>
                )}

                {analysis.volatility_analysis.recommendation && (
                  <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-4">
                    <p className="text-sm font-semibold text-green-400 mb-1">✅ Recommendation</p>
                    <p className="text-sm text-white/70">{analysis.volatility_analysis.recommendation}</p>
                  </div>
                )}
              </div>
            )}
            {/* Event Analysis */}
            {analysis.event_analysis?.map((e, i) => (
              <div key={i} className="rounded-3xl border border-blue-500/20 bg-blue-500/5 p-6">
                <h3 className="mb-4 text-lg font-bold text-blue-400">{e.currency} — {e.event}</h3>
                <div className="grid gap-4 sm:grid-cols-2 mb-4">
                  <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-4">
                    <p className="text-sm font-semibold text-green-400 mb-2">If Beats Forecast</p>
                    <p className="text-2xl font-bold text-green-400">{e.if_beats?.probability}%</p>
                    <p className="text-sm text-white/60">{e.if_beats?.direction}</p>
                    <p className="text-sm text-white/40">Avg move: {e.if_beats?.avg_pips} pips</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {e.if_beats?.pairs_affected?.map((p, j) => (
                        <span key={j} className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-300">{p}</span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
                    <p className="text-sm font-semibold text-red-400 mb-2">If Misses Forecast</p>
                    <p className="text-2xl font-bold text-red-400">{e.if_misses?.probability}%</p>
                    <p className="text-sm text-white/60">{e.if_misses?.direction}</p>
                    <p className="text-sm text-white/40">Avg move: {e.if_misses?.avg_pips} pips</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {e.if_misses?.pairs_affected?.map((p, j) => (
                        <span key={j} className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs text-red-300">{p}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4 mb-3">
                  <p className="text-sm font-semibold text-white/60 mb-1">📊 Historical Note</p>
                  <p className="text-sm text-white/80">{e.historical_note}</p>
                </div>
                <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-4">
                  <p className="text-sm font-semibold text-yellow-400 mb-1">📋 Trade Plan</p>
                  <p className="text-sm text-white/80">{e.trade_plan}</p>
                </div>
              </div>
            ))}

            {/* Execute Trade */}
            <div className="rounded-3xl border border-green-500/20 bg-green-500/5 p-6">
              <h2 className="mb-2 text-xl font-semibold text-green-400">⚡ Execute Trade in MT5</h2>
              <p className="mb-4 text-sm text-white/40">Send a signal to your MT5 EA. Trade executes automatically within 30 seconds.</p>

              {executeMessage && (
                <div className="mb-4 rounded-2xl border border-green-500/20 bg-green-500/10 p-3 text-green-300 text-sm">
                  {executeMessage}
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-3 mb-4">
                <div>
                  <label className="text-xs text-white/40 mb-1 block">Symbol</label>
                  <input value={tradeForm.symbol} onChange={e => setTradeForm({...tradeForm, symbol: e.target.value})}
                    className="w-full rounded-xl border border-white/10 bg-black/50 p-3 text-sm text-white outline-none" placeholder="EURUSD" />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1 block">Direction</label>
                  <select value={tradeForm.type} onChange={e => setTradeForm({...tradeForm, type: e.target.value})}
                    className="w-full rounded-xl border border-white/10 bg-black/50 p-3 text-sm text-white outline-none">
                    <option>BUY</option>
                    <option>SELL</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1 block">Lot Size</label>
                  <input type="number" value={tradeForm.lot} onChange={e => setTradeForm({...tradeForm, lot: Number(e.target.value)})}
                    className="w-full rounded-xl border border-white/10 bg-black/50 p-3 text-sm text-white outline-none" step="0.01" />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1 block">Stop Loss (pips)</label>
                  <input type="number" value={tradeForm.sl} onChange={e => setTradeForm({...tradeForm, sl: Number(e.target.value)})}
                    className="w-full rounded-xl border border-white/10 bg-black/50 p-3 text-sm text-white outline-none" />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1 block">Take Profit (pips)</label>
                  <input type="number" value={tradeForm.tp} onChange={e => setTradeForm({...tradeForm, tp: Number(e.target.value)})}
                    className="w-full rounded-xl border border-white/10 bg-black/50 p-3 text-sm text-white outline-none" />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1 block">MT5 Account</label>
                  <input value={tradeForm.account} onChange={e => setTradeForm({...tradeForm, account: e.target.value})}
                    className="w-full rounded-xl border border-white/10 bg-black/50 p-3 text-sm text-white outline-none" placeholder="521091015" />
                </div>
              </div>

              <button onClick={executeTradeSignal} disabled={executing}
                className="w-full rounded-2xl bg-green-600 py-3 font-semibold transition hover:bg-green-700 disabled:opacity-50">
                {executing ? "Sending Signal..." : "⚡ Execute Trade in MT5"}
              </button>
            </div>

          </div>
        )}
      </div>
    </AppShell>
  );
}