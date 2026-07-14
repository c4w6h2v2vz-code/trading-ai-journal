"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";

type ForexPair = {
  pair: string;
  current_price: string;
  direction: string;
  confidence: number;
  target: string;
  stop_loss: string;
  reason: string;
  volatility: string;
  volatility_score: number;
  expected_range: string;
  best_time_cet: string;
  key_support: string;
  key_resistance: string;
};

type CryptoCoin = {
  coin: string;
  price: string;
  direction: string;
  confidence: number;
  target: string;
  move_percent: string;
  reason: string;
  category: string;
};

type BestTrade = {
  rank: number;
  asset: string;
  direction: string;
  entry: string;
  target: string;
  stop: string;
  confidence: number;
  risk_reward: string;
  timeframe: string;
  reasoning: string;
};

type HotPair = {
  pair: string;
  reason: string;
  expected_move: string;
  direction: string;
};

type EventToday = {
  time: string;
  currency: string;
  event: string;
  impact: string;
  forecast: string;
  previous: string;
  expected_move: string;
  historical_note?: string;
  bias_direction?: string;
  bias_strength?: string;
  if_beats_forecast?: string;
  if_misses_forecast?: string;
};

type Brief = {
  brief_date: string;
  brief_time: string;
  headline: string;
  market_mood: string;
  summary: string;
  key_theme: string;
  hot_pairs: HotPair[];
  top_movers: {
    gainers: { symbol: string; price: string; change_24h: string; continue_probability: number; next_24h_target: string; reason: string; trade_plan: string }[];
    losers: { symbol: string; price: string; change_24h: string; bounce_probability: number; reason: string }[];
    best_momentum_trade: string;
  };
  forex_analysis: {
    pairs: ForexPair[];
    dxy_analysis: string;
    best_forex_trade: string;
  };
  crypto_analysis: {
    sentiment: string;
    fear_greed: string;
    btc_dominance: string;
    coins: CryptoCoin[];
    meme_alert: string;
    best_crypto_trade: string;
  };
  cot_report: {
    summary: string;
    positions: { pair: string; position: string; signal: string; insight: string }[];
  };
  correlations: { assets: string; value: string; meaning: string; action: string }[];
  economic_surprises: { event: string; result: string; impact: string }[];
  events_today: EventToday[];
  best_trades: BestTrade[];
  volatility_overview: {
    overall: string;
    hottest_pair: string;
    best_window_cet: string;
    avoid_window_cet: string;
    news_warning: string;
  };
  action_items: string[];
};

export default function MorningBriefPage() {
  const [loading, setLoading] = useState(false);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [error, setError] = useState("");
  const [executingTrade, setExecutingTrade] = useState<number | null>(null);
  const [tradeMessages, setTradeMessages] = useState<Record<number, string>>({});

  async function generate() {
    setLoading(true);
    setError("");
    setBrief(null);
    setTradeMessages({});
    try {
      const response = await fetch("/api/morning-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (data.error) setError(data.error);
      else setBrief(data);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function executeTrade(trade: BestTrade) {
    const savedSettings = localStorage.getItem("intelligence-settings");
    if (!savedSettings) {
      alert("Please set your MT5 account in the Intelligence page first.");
      return;
    }

    const settings = JSON.parse(savedSettings);
    if (!settings.accountNumber) {
      alert("Please set your MT5 account number first.");
      return;
    }

    setExecutingTrade(trade.rank);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const res = await fetch("/api/mt5/signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          account: settings.accountNumber,
          symbol: trade.asset.replace("/", ""),
          trade_type: trade.direction === "Buy" ? "BUY" : "SELL",
          lot_size: 0.01,
          stop_loss_pips: 30,
          take_profit_pips: 60,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTradeMessages(prev => ({ ...prev, [trade.rank]: `✅ Signal sent! ${trade.direction} ${trade.asset} executing in MT5` }));
      } else {
        setTradeMessages(prev => ({ ...prev, [trade.rank]: "Error: " + data.error }));
      }
    } catch (err) {
      setTradeMessages(prev => ({ ...prev, [trade.rank]: "Error: " + String(err) }));
    } finally {
      setExecutingTrade(null);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <p className="mb-3 w-fit rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1 text-sm text-blue-300">
            🌅 Morning Brief
          </p>
          <h1 className="text-4xl font-bold">Daily Market Intelligence</h1>
          <p className="mt-1 text-sm text-blue-400">
            📅 {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            {" · "}
            🕐 {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Europe/Vienna" })} CET
          </p>
          <p className="mt-2 text-white/40">
            Bloomberg-level intelligence. Real prices, real news, 8 forex pairs, crypto, COT data. All in CET.
          </p>
        </div>

        <button
          onClick={generate}
          disabled={loading}
          className="mb-8 w-full rounded-2xl bg-blue-600 py-4 text-lg font-semibold transition hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "🤖 Scanning Markets, News & Institutional Flow..." : "🌅 Generate Morning Brief"}
        </button>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-400 text-sm">{error}</div>
        )}

        {brief && (
          <div className="space-y-6">

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
              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-3">
                <p className="text-xs text-blue-400 font-semibold mb-1">🎯 Key Theme</p>
                <p className="text-sm text-white/70">{brief.key_theme}</p>
              </div>
            </div>

            {/* Hot Pairs */}
            {brief.hot_pairs && brief.hot_pairs.length > 0 && (
              <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-6">
                <h2 className="mb-4 text-xl font-semibold text-red-400">🔥 Hottest Pairs Today</h2>
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

            {/* Volatility Overview */}
            {brief.volatility_overview && (
              <div className="rounded-3xl border border-orange-500/20 bg-orange-500/5 p-6">
                <h2 className="mb-4 text-xl font-semibold text-orange-400">⚡ Volatility Overview</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-xs text-white/40">Overall</p>
                    <p className={`text-xl font-bold mt-1 ${
                      brief.volatility_overview.overall === "High" || brief.volatility_overview.overall === "Extreme" ? "text-red-400" :
                      brief.volatility_overview.overall === "Medium" ? "text-yellow-400" : "text-green-400"
                    }`}>{brief.volatility_overview.overall}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-xs text-white/40">Best Window</p>
                    <p className="text-sm font-bold mt-1 text-green-400">{brief.volatility_overview.best_window_cet}</p>
                  </div>
                </div>
                {brief.volatility_overview.hottest_pair && (
                  <div className="mt-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-3">
                    <p className="text-xs text-red-400">🔥 Hottest: {brief.volatility_overview.hottest_pair}</p>
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

            {/* Today's Events */}
            {brief.events_today && brief.events_today.length > 0 && (
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                <h2 className="mb-4 text-xl font-semibold">📅 Today's Events (CET)</h2>
                <div className="space-y-3">
                  {brief.events_today.map((evt, i) => (
                    <div key={i} className={`rounded-2xl border p-3 ${
                      evt.impact === "High" ? "border-red-500/20 bg-red-500/5" : "border-yellow-500/20 bg-yellow-500/5"
                    }`}>
                      <div className="flex items-center justify-between">
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
                      {evt.bias_direction && (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                            evt.bias_direction.toLowerCase().includes("bull") ? "bg-green-500/20 text-green-400" :
                            evt.bias_direction.toLowerCase().includes("bear") ? "bg-red-500/20 text-red-400" :
                            "bg-yellow-500/20 text-yellow-400"
                          }`}>
                            📊 Bias: {evt.bias_direction}
                          </span>
                          {evt.bias_strength && (
                            <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/50">
                              {evt.bias_strength}
                            </span>
                          )}
                        </div>
                      )}
                      {evt.historical_note && (
                        <div className="mt-2 rounded-xl bg-black/30 p-3">
                          <p className="text-xs text-purple-400 font-semibold mb-1">📚 Historically</p>
                          <p className="text-xs text-white/60">{evt.historical_note}</p>
                          <p className="text-[10px] text-white/30 mt-2">General historical tendency, not a prediction or guarantee.</p>
                        </div>
                      )}
                      {(evt.if_beats_forecast || evt.if_misses_forecast) && (
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          {evt.if_beats_forecast && (
                            <div className="rounded-xl bg-green-500/5 border border-green-500/10 p-3">
                              <p className="text-xs text-green-400 font-semibold mb-1">If beats forecast</p>
                              <p className="text-xs text-white/60">{evt.if_beats_forecast}</p>
                            </div>
                          )}
                          {evt.if_misses_forecast && (
                            <div className="rounded-xl bg-red-500/5 border border-red-500/10 p-3">
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

            {/* Forex Analysis */}
            {brief.forex_analysis && (
              <div className="rounded-3xl border border-green-500/20 bg-green-500/5 p-6">
                <h2 className="mb-4 text-xl font-semibold text-green-400">💱 Forex Analysis (8 Pairs)</h2>

                {brief.forex_analysis.dxy_analysis && (
                  <div className="mb-4 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-3">
                    <p className="text-xs text-yellow-400 font-semibold mb-1">💵 DXY</p>
                    <p className="text-sm text-white/70">{brief.forex_analysis.dxy_analysis}</p>
                  </div>
                )}

                <div className="space-y-3">
                  {brief.forex_analysis.pairs?.map((pair, i) => (
                    <div key={i} className={`rounded-2xl border p-4 ${
                      pair.direction === "Bullish" ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5"
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold">{pair.pair}</span>
                          <span className="text-sm text-white/40">{pair.current_price}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${pair.direction === "Bullish" ? "text-green-400" : "text-red-400"}`}>
                            {pair.direction === "Bullish" ? "↑" : "↓"} {pair.direction}
                          </span>
                          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">{pair.confidence}%</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="rounded-xl bg-black/30 p-2 text-center">
                          <p className="text-xs text-white/30">Target</p>
                          <p className="text-sm font-bold text-green-400">{pair.target}</p>
                        </div>
                        <div className="rounded-xl bg-black/30 p-2 text-center">
                          <p className="text-xs text-white/30">Stop</p>
                          <p className="text-sm font-bold text-red-400">{pair.stop_loss}</p>
                        </div>
                        <div className="rounded-xl bg-black/30 p-2 text-center">
                          <p className="text-xs text-white/30">Range</p>
                          <p className="text-sm font-bold text-yellow-400">{pair.expected_range}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                            pair.volatility === "High" || pair.volatility === "Extreme" ? "bg-red-500/20 text-red-400" :
                            pair.volatility === "Medium" ? "bg-yellow-500/20 text-yellow-400" : "bg-green-500/20 text-green-400"
                          }`}>{pair.volatility}</span>
                          <span className="text-xs text-white/30">Score: {pair.volatility_score}/100</span>
                        </div>
                        <span className="text-xs text-white/30">🕐 {pair.best_time_cet}</span>
                      </div>

                      <div className="h-1.5 rounded-full bg-white/10 mb-2">
                        <div className={`h-1.5 rounded-full ${
                          pair.volatility_score >= 80 ? "bg-red-500" : pair.volatility_score >= 60 ? "bg-yellow-500" : "bg-green-500"
                        }`} style={{ width: `${pair.volatility_score}%` }} />
                      </div>

                      <p className="text-xs text-white/40 mb-1">S: {pair.key_support} | R: {pair.key_resistance}</p>
                      <p className="text-xs text-white/60">{pair.reason}</p>
                    </div>
                  ))}
                </div>

                {brief.forex_analysis.best_forex_trade && (
                  <div className="mt-4 rounded-2xl border border-green-500/20 bg-green-500/5 p-3">
                    <p className="text-xs text-green-400 font-semibold mb-1">🏆 Best Forex Trade</p>
                    <p className="text-sm text-white/70">{brief.forex_analysis.best_forex_trade}</p>
                  </div>
                )}
              </div>
            )}

            {/* Top Movers */}
            {brief.top_movers && (
              <div className="rounded-3xl border border-green-500/20 bg-green-500/5 p-6">
                <h2 className="mb-4 text-xl font-semibold text-green-400">🚀 Top Movers (24h Real Data)</h2>

                {brief.top_movers.gainers?.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-green-400 mb-3">📈 Top Gainers</p>
                    <div className="space-y-3">
                      {brief.top_movers.gainers.map((g, i) => (
                        <div key={i} className="rounded-2xl border border-green-500/20 bg-green-500/5 p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-bold">{g.symbol}</span>
                              <span className="text-sm text-white/40">{g.price}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-green-400 font-bold">{String(g.change_24h).replace('%', '')}%</span>
                              <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs text-blue-400">
                                {g.continue_probability}% continue
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-white/40 mb-1">Next 24h: {g.next_24h_target}</p>
                          <p className="text-xs text-white/60 mb-1">{g.reason}</p>
                          <p className="text-xs text-yellow-400">📋 {g.trade_plan}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {brief.top_movers.losers?.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-red-400 mb-3">📉 Top Losers</p>
                    <div className="space-y-3">
                      {brief.top_movers.losers.map((l, i) => (
                        <div key={i} className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-bold">{l.symbol}</span>
                              <span className="text-sm text-white/40">{l.price}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-red-400 font-bold">{String(l.change_24h).replace('%', '')}%</span>
                              <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs text-yellow-400">
                                {l.bounce_probability}% bounce
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-white/60">{l.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {brief.top_movers.best_momentum_trade && (
                  <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-4">
                    <p className="text-xs font-semibold text-green-400 mb-1">🏆 Best Momentum Trade</p>
                    <p className="text-sm text-white/70">{brief.top_movers.best_momentum_trade}</p>
                  </div>
                )}
              </div>
            )}

            {/* Crypto Analysis */}
            {brief.crypto_analysis && (
              <div className="rounded-3xl border border-yellow-500/20 bg-yellow-500/5 p-6">
                <h2 className="mb-4 text-xl font-semibold text-yellow-400">🪙 Crypto Analysis</h2>

                <div className="grid gap-3 sm:grid-cols-3 mb-4">
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                    <p className="text-xs text-white/40">Sentiment</p>
                    <p className={`text-lg font-bold mt-1 ${
                      brief.crypto_analysis.sentiment === "Bullish" ? "text-green-400" :
                      brief.crypto_analysis.sentiment === "Bearish" ? "text-red-400" : "text-yellow-400"
                    }`}>{brief.crypto_analysis.sentiment}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                    <p className="text-xs text-white/40">Fear & Greed</p>
                    <p className="text-lg font-bold mt-1 text-yellow-400">{brief.crypto_analysis.fear_greed}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                    <p className="text-xs text-white/40">BTC Dominance</p>
                    <p className="text-lg font-bold mt-1 text-orange-400">{brief.crypto_analysis.btc_dominance}</p>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  {brief.crypto_analysis.coins?.map((coin, i) => (
                    <div key={i} className={`rounded-2xl border p-4 ${
                      coin.direction === "Bullish" ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5"
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-lg">{coin.coin}</span>
                          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">{coin.category}</span>
                          <span className="text-sm text-white/40">${coin.price}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${coin.direction === "Bullish" ? "text-green-400" : "text-red-400"}`}>
                            {coin.move_percent}
                          </span>
                          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">{coin.confidence}%</span>
                        </div>
                      </div>
                      <p className="text-xs text-white/40 mb-1">Target: {coin.target}</p>
                      <p className="text-xs text-white/60">{coin.reason}</p>
                    </div>
                  ))}
                </div>

                {brief.crypto_analysis.meme_alert && (
                  <div className="mb-4 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-3">
                    <p className="text-xs text-orange-400 font-semibold mb-1">🔥 Meme Alert</p>
                    <p className="text-sm text-white/70">{brief.crypto_analysis.meme_alert}</p>
                  </div>
                )}

                {brief.crypto_analysis.best_crypto_trade && (
                  <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-3">
                    <p className="text-xs text-yellow-400 font-semibold mb-1">🏆 Best Crypto Trade</p>
                    <p className="text-sm text-white/70">{brief.crypto_analysis.best_crypto_trade}</p>
                  </div>
                )}
              </div>
            )}

            {/* COT Report */}
            {brief.cot_report && (
              <div className="rounded-3xl border border-purple-500/20 bg-purple-500/5 p-6">
                <h2 className="mb-2 text-xl font-semibold text-purple-400">🏦 COT Report</h2>
                <p className="text-sm text-white/50 mb-4">{brief.cot_report.summary}</p>
                <div className="space-y-2">
                  {brief.cot_report.positions?.map((pos, i) => (
                    <div key={i} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 p-3">
                      <div>
                        <p className="font-bold text-sm">{pos.pair}</p>
                        <p className="text-xs text-white/40">{pos.insight}</p>
                      </div>
                      <div className="text-right">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                          pos.signal === "Bullish" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                        }`}>{pos.signal}</span>
                        <p className="text-xs text-white/40 mt-1">{pos.position}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Correlations */}
            {brief.correlations && brief.correlations.length > 0 && (
              <div className="rounded-3xl border border-yellow-500/20 bg-yellow-500/5 p-6">
                <h2 className="mb-4 text-xl font-semibold text-yellow-400">🔗 Correlations</h2>
                <div className="space-y-2">
                  {brief.correlations.map((corr, i) => (
                    <div key={i} className="rounded-2xl border border-white/10 bg-black/30 p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-bold text-sm">{corr.assets}</p>
                        <span className={`text-sm font-bold ${corr.value.startsWith("-") ? "text-red-400" : "text-green-400"}`}>{corr.value}</span>
                      </div>
                      <p className="text-xs text-white/60">{corr.meaning}</p>
                      <p className="text-xs text-blue-400 mt-1">→ {corr.action}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Economic Surprises */}
            {brief.economic_surprises && brief.economic_surprises.length > 0 && (
              <div className="rounded-3xl border border-orange-500/20 bg-orange-500/5 p-6">
                <h2 className="mb-4 text-xl font-semibold text-orange-400">📊 Economic Surprises</h2>
                <div className="space-y-2">
                  {brief.economic_surprises.map((s, i) => (
                    <div key={i} className="rounded-2xl border border-white/10 bg-black/30 p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-bold text-sm">{s.event}</p>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                          s.result.toLowerCase().includes("beat") ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                        }`}>{s.result}</span>
                      </div>
                      <p className="text-xs text-white/60">{s.impact}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Best Trades */}
            {brief.best_trades && brief.best_trades.length > 0 && (
              <div className="rounded-3xl border border-green-500/20 bg-green-500/5 p-6">
                <h2 className="mb-4 text-xl font-semibold text-green-400">⭐ Best Trades Today</h2>
                <div className="space-y-4">
                  {brief.best_trades.map((trade, i) => (
                    <div key={i} className={`rounded-2xl border p-4 ${
                      trade.direction === "Buy" ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5"
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold">{trade.rank}</span>
                          <span className="text-xl font-bold">{trade.asset}</span>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                            trade.direction === "Buy" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                          }`}>{trade.direction}</span>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-sm font-bold ${
                          trade.confidence >= 75 ? "bg-green-500/20 text-green-400" :
                          trade.confidence >= 65 ? "bg-blue-500/20 text-blue-400" : "bg-yellow-500/20 text-yellow-400"
                        }`}>{trade.confidence}%</span>
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

                      <p className="text-xs text-white/40 mb-1">⏱ {trade.timeframe} · RR: {trade.risk_reward}</p>
                      <p className="text-xs text-white/60 mb-3">{trade.reasoning}</p>

                      {tradeMessages[trade.rank] && (
                        <div className={`mb-3 rounded-xl p-2 text-xs ${
                          tradeMessages[trade.rank].startsWith("✅") ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                        }`}>{tradeMessages[trade.rank]}</div>
                      )}

                      {trade.confidence >= 65 && (
                        <button
                          onClick={() => executeTrade(trade)}
                          disabled={executingTrade === trade.rank}
                          className="w-full rounded-xl bg-green-600 py-2.5 text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50"
                        >
                          {executingTrade === trade.rank ? "Sending..." : `⚡ Execute ${trade.direction} ${trade.asset} in MT5`}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Items */}
            {brief.action_items && brief.action_items.length > 0 && (
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

          </div>
        )}
      </div>
    </AppShell>
  );
}