"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";

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
  const [accountNumber, setAccountNumber] = useState("");
  const [accountBalance, setAccountBalance] = useState(10000);
  const [riskPercent, setRiskPercent] = useState(2);
  const [executingTrade, setExecutingTrade] = useState<number | null>(null);
  const [tradeMessages, setTradeMessages] = useState<Record<number, string>>({});
  const [autoExecute, setAutoExecute] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("intelligence-settings");
    if (saved) {
      const s = JSON.parse(saved);
      setAccountNumber(s.accountNumber || "");
      setAccountBalance(s.accountBalance || 10000);
      setRiskPercent(s.riskPercent || 2);
    }
  }, []);

  function saveSettings() {
    localStorage.setItem("intelligence-settings", JSON.stringify({
      accountNumber, accountBalance, riskPercent
    }));
    alert("Settings saved ✅");
  }

  function calculateLotSize(accountBalance: number, riskPercent: number, slPips: number) {
    const riskAmount = (accountBalance * riskPercent) / 100;
    const pipValue = 10; // $10 per pip for standard lot on major pairs
    const lotSize = riskAmount / (slPips * pipValue);
    return Math.max(0.01, Math.min(parseFloat(lotSize.toFixed(2)), 10));
  }

  function calculateSLPips(entry: string, stop: string, direction: string) {
    const entryNum = parseFloat(entry.replace(/[^0-9.]/g, ""));
    const stopNum = parseFloat(stop.replace(/[^0-9.]/g, ""));
    if (!entryNum || !stopNum) return 30;
    const diff = Math.abs(entryNum - stopNum);
    if (entryNum > 100) return Math.round(diff); // JPY pairs or crypto
    return Math.round(diff * 10000); // Forex pairs
  }

  function calculateTPPips(entry: string, target: string, direction: string) {
    const entryNum = parseFloat(entry.replace(/[^0-9.]/g, ""));
    const targetNum = parseFloat(target.replace(/[^0-9.]/g, ""));
    if (!entryNum || !targetNum) return 60;
    const diff = Math.abs(entryNum - targetNum);
    if (entryNum > 100) return Math.round(diff);
    return Math.round(diff * 10000);
  }

  async function executeTrade(trade: BestTrade, rank: number) {
    if (!accountNumber) {
      alert("Please enter your MT5 account number in settings above.");
      return;
    }

    setExecutingTrade(rank);
    setTradeMessages(prev => ({ ...prev, [rank]: "Sending signal to MT5..." }));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const slPips = calculateSLPips(trade.entry, trade.stop, trade.direction);
      const tpPips = calculateTPPips(trade.entry, trade.target, trade.direction);
      const lotSize = calculateLotSize(accountBalance, riskPercent, slPips);

      const symbol = trade.asset.replace("/", "").replace("USD", "USD");

      const res = await fetch("/api/mt5/signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          account: accountNumber,
          symbol,
          trade_type: trade.direction === "Buy" ? "BUY" : "SELL",
          lot_size: lotSize,
          stop_loss_pips: slPips,
          take_profit_pips: tpPips,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTradeMessages(prev => ({
          ...prev,
          [rank]: `✅ Signal sent! ${trade.direction} ${trade.asset} — Lot: ${lotSize} (${riskPercent}% risk = $${((accountBalance * riskPercent) / 100).toFixed(0)}) — SL: ${slPips} pips — TP: ${tpPips} pips`
        }));
      } else {
        setTradeMessages(prev => ({ ...prev, [rank]: "Error: " + data.error }));
      }
    } catch (err) {
      setTradeMessages(prev => ({ ...prev, [rank]: "Error: " + String(err) }));
    } finally {
      setExecutingTrade(null);
    }
  }

  async function generate() {
    setLoading(true);
    setError("");
    setIntel(null);
    setTradeMessages({});
    try {
      const response = await fetch("/api/intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (data.error) {
        setError(data.error);
      } else {
        setIntel(data);

        // Auto execute if enabled and account is set
        if (autoExecute && accountNumber && data.best_trades_today?.length > 0) {
          const topTrade = data.best_trades_today[0];
          if (topTrade.confidence >= 65) {
            setTimeout(() => executeTrade(topTrade, 1), 2000);
          }
        }
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
          <p className="mb-3 w-fit rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1 text-sm text-blue-300">
            🏦 Market Intelligence
          </p>
          <h1 className="text-4xl font-bold">Morning Intelligence Brief</h1>
          <p className="mt-1 text-sm text-blue-400">
            📅 {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
          <p className="mt-2 text-white/40">
            Bloomberg-level intelligence with automatic trade execution.
          </p>
        </div>

        {/* Settings */}
        <div className="mb-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="mb-4 text-lg font-semibold">⚙️ Trading Settings</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-xs text-white/40 mb-1 block">MT5 Account Number</label>
              <input
                value={accountNumber}
                onChange={e => setAccountNumber(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/50 p-3 text-sm text-white outline-none focus:border-blue-500"
                placeholder="521091015"
              />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">Account Balance ($)</label>
              <input
                type="number"
                value={accountBalance}
                onChange={e => setAccountBalance(Number(e.target.value))}
                className="w-full rounded-xl border border-white/10 bg-black/50 p-3 text-sm text-white outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">Risk Per Trade (%)</label>
              <input
                type="number"
                value={riskPercent}
                onChange={e => setRiskPercent(Number(e.target.value))}
                className="w-full rounded-xl border border-white/10 bg-black/50 p-3 text-sm text-white outline-none focus:border-blue-500"
                min="0.5"
                max="5"
                step="0.5"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setAutoExecute(!autoExecute)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${autoExecute ? "bg-green-600" : "bg-white/20"}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${autoExecute ? "translate-x-6" : "translate-x-1"}`} />
              </button>
              <div>
                <p className="text-sm font-semibold">Auto Execute Top Trade</p>
                <p className="text-xs text-white/40">Automatically execute the #1 trade when confidence ≥ 65%</p>
              </div>
            </div>
            <button
              onClick={saveSettings}
              className="rounded-xl bg-white/10 px-4 py-2 text-sm hover:bg-white/20 transition"
            >
              Save Settings
            </button>
          </div>

          {accountNumber && accountBalance > 0 && (
            <div className="mt-4 rounded-2xl border border-green-500/20 bg-green-500/5 p-3">
              <p className="text-sm text-green-400">
                💰 Risk per trade: <strong>${((accountBalance * riskPercent) / 100).toFixed(2)}</strong> ({riskPercent}% of ${accountBalance.toLocaleString()})
              </p>
            </div>
          )}
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
                        <span className={`rounded-full px-3 py-1 text-sm font-bold ${
                          trade.confidence >= 75 ? "bg-green-500/20 text-green-400" :
                          trade.confidence >= 65 ? "bg-blue-500/20 text-blue-400" :
                          "bg-yellow-500/20 text-yellow-400"
                        }`}>
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
                      <p className="text-xs text-white/60 mb-3">{trade.reasoning}</p>

                      {/* Risk calculation display */}
                      {accountBalance > 0 && (
                        <div className="mb-3 rounded-xl bg-black/20 p-2 text-xs text-white/40">
                          Risk: ${((accountBalance * riskPercent) / 100).toFixed(0)} ({riskPercent}%) •
                          Lot: {calculateLotSize(
                            accountBalance,
                            riskPercent,
                            calculateSLPips(trade.entry, trade.stop, trade.direction)
                          )}
                        </div>
                      )}

                      {/* Trade message */}
                      {tradeMessages[trade.rank] && (
                        <div className={`mb-3 rounded-xl p-2 text-xs ${
                          tradeMessages[trade.rank].startsWith("✅") 
                            ? "bg-green-500/10 text-green-400" 
                            : "bg-red-500/10 text-red-400"
                        }`}>
                          {tradeMessages[trade.rank]}
                        </div>
                      )}

                      {/* Execute button */}
                      {trade.confidence >= 65 && (
                        <button
                          onClick={() => executeTrade(trade, trade.rank)}
                          disabled={executingTrade === trade.rank}
                          className="w-full rounded-xl bg-green-600 py-2.5 text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50"
                        >
                          {executingTrade === trade.rank
                            ? "Sending to MT5..."
                            : `⚡ Execute ${trade.direction} ${trade.asset} in MT5`}
                        </button>
                      )}

                      {trade.confidence < 65 && (
                        <div className="rounded-xl bg-yellow-500/10 p-2 text-xs text-yellow-400 text-center">
                          ⚠️ Confidence below 65% — not recommended to trade
                        </div>
                      )}
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
                          <span className={`text-sm font-bold ${corr.correlation.startsWith("-") ? "text-red-400" : "text-green-400"}`}>
                            {corr.correlation}
                          </span>
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
                          surprise.surprise.toLowerCase().includes("beat") ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
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