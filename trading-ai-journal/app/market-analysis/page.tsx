"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";

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

type Analysis = {
  overall_bias: Record<string, PairBias>;
  event_analysis: EventAnalysis[];
  warning: string;
  best_pairs_to_trade: string[];
  pairs_to_avoid: string[];
};

const defaultEvents: NewsEvent[] = [];

export default function MarketAnalysisPage() {
  const [events, setEvents] = useState<NewsEvent[]>(defaultEvents);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingNews, setFetchingNews] = useState(false);
  const [newEvent, setNewEvent] = useState<NewsEvent>({
    time: "", currency: "USD", event: "", impact: "High", forecast: "", previous: ""
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
          <p className="mt-2 text-white/40">
            Add today's news events and AI will analyze historical data to give you trade probabilities.
          </p>
        </div>

        {/* Add Events */}
        <div className="mb-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="mb-4 text-xl font-semibold">Today's News Events</h2>
<button
            onClick={fetchTodaysNews}
            disabled={fetchingNews}
            className="mb-4 w-full rounded-2xl border border-blue-500/20 bg-blue-500/10 py-3 text-sm font-semibold text-blue-400 hover:bg-blue-500/20 transition disabled:opacity-50"
          >
            {fetchingNews ? "Fetching today's news..." : "🔄 Load Today's Real News"}
          </button>
          {/* Event list */}
          <div className="mb-4 space-y-2">
            {events.map((e, i) => (
              <div key={i} className={`flex items-center justify-between rounded-2xl border p-3 ${
                e.impact === "High" ? "border-red-500/20 bg-red-500/5" :
                e.impact === "Medium" ? "border-yellow-500/20 bg-yellow-500/5" :
                "border-white/10 bg-white/5"
              }`}>
                <div className="flex items-center gap-3">
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
                <button onClick={() => removeEvent(i)} className="text-xs text-red-400 hover:text-red-300">Remove</button>
              </div>
            ))}
          </div>

          {/* Add new event */}
          <div className="grid gap-2 sm:grid-cols-3">
            <input value={newEvent.time} onChange={e => setNewEvent({...newEvent, time: e.target.value})}
              placeholder="Time e.g. 08:30" className="rounded-xl border border-white/10 bg-black/50 p-3 text-sm text-white outline-none" />
            <select value={newEvent.currency} onChange={e => setNewEvent({...newEvent, currency: e.target.value})}
              className="rounded-xl border border-white/10 bg-black/50 p-3 text-sm text-white outline-none">
              {["USD", "EUR", "GBP", "JPY", "CHF", "AUD", "CAD", "NZD"].map(c => <option key={c}>{c}</option>)}
            </select>
            <input value={newEvent.event} onChange={e => setNewEvent({...newEvent, event: e.target.value})}
              placeholder="Event name e.g. NFP" className="rounded-xl border border-white/10 bg-black/50 p-3 text-sm text-white outline-none" />
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
          <button onClick={addEvent} className="mt-3 rounded-xl bg-white/10 px-4 py-2 text-sm hover:bg-white/20">
            + Add Event
          </button>
        </div>

        {/* Analyze button */}
        <button
          onClick={analyze}
          disabled={loading || events.length === 0}
          className="mb-8 w-full rounded-2xl bg-green-600 py-4 text-lg font-semibold transition hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? "🤖 AI Analyzing Historical Data..." : "🤖 Generate AI Market Analysis"}
        </button>

        {/* Analysis Results */}
        {analysis && (
          <div className="space-y-6">
            {/* Warning */}
            {analysis.warning && (
              <div className="rounded-3xl border border-yellow-500/20 bg-yellow-500/5 p-5">
                <p className="font-semibold text-yellow-400">⚠️ {analysis.warning}</p>
              </div>
            )}

            {/* Best pairs and avoid */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-green-500/20 bg-green-500/5 p-5">
                <p className="mb-3 text-sm font-semibold text-green-400">✅ Best Pairs to Trade</p>
                <div className="flex flex-wrap gap-2">
                  {analysis.best_pairs_to_trade?.map(p => (
                    <span key={p} className="rounded-full bg-green-500/20 px-3 py-1 text-sm text-green-300">{p}</span>
                  ))}
                </div>
              </div>
              <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-5">
                <p className="mb-3 text-sm font-semibold text-red-400">❌ Pairs to Avoid</p>
                <div className="flex flex-wrap gap-2">
                  {analysis.pairs_to_avoid?.map(p => (
                    <span key={p} className="rounded-full bg-red-500/20 px-3 py-1 text-sm text-red-300">{p}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Overall bias */}
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
                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/60">
                          {bias.confidence}%
                        </span>
                      </div>
                    </div>
                    {/* Confidence bar */}
                    <div className="h-2 rounded-full bg-white/10">
                      <div
                        className={`h-2 rounded-full ${bias.direction === "Bullish" ? "bg-green-500" : "bg-red-500"}`}
                        style={{ width: `${bias.confidence}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-white/50">{bias.reason}</p>
                  </div>
                ))}
              </div>
            </div>

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
          </div>
        )}
      </div>
    </AppShell>
  );
}