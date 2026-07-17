"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";

type Segment = {
  key: string;
  trades: number;
  win_rate: number;
  total_pl: number;
  expectancy: number;
  avg_win: number;
  avg_loss: number;
  profit_factor: number | string;
  wins: number;
  losses: number;
};

type Analysis = {
  sample_warning: string;
  headline: string;
  your_edge: { finding: string; sample_size: number; is_significant: boolean; caveat: string };
  your_leak: { finding: string; sample_size: number; cost: string; fix: string };
  stop_doing: string[];
  rr_reality: string;
  session_insight: string;
  pair_insight: string;
  time_insight: string;
  psychology_insight: string;
  next_steps: string[];
  overfitting_warning: string;
  overall: Segment;
  by_session: Segment[];
  by_pair: Segment[];
  by_strategy: Segment[];
  by_emotion: Segment[];
  by_grade: Segment[];
  by_direction: Segment[];
  by_hour: Segment[];
  by_day: Segment[];
  by_timeframe: Segment[];
  mistake_cost: Segment[];
  avg_planned_rr: number | null;
  actual_rr: number | null;
  source_filter: string;
};

export default function EdgeFinderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState("");
  const [activeAccount, setActiveAccount] = useState<any>(null);
  const [tab, setTab] = useState("session");
  const [source, setSource] = useState("All");

  useEffect(() => {
    const saved = localStorage.getItem("active_account");
    if (saved) setActiveAccount(JSON.parse(saved));
  }, []);

  async function analyze() {
    setLoading(true);
    setError("");
    setAnalysis(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const response = await fetch("/api/edge-finder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          accountNumber: activeAccount?.account_number || null,
          source,
        }),
      });
      const data = await response.json();
      if (data.error) setError(data.error);
      else setAnalysis(data);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  const tabs = [
    { id: "session", label: "Session", data: analysis?.by_session },
    { id: "pair", label: "Pair", data: analysis?.by_pair },
    { id: "strategy", label: "Strategy", data: analysis?.by_strategy },
    { id: "emotion", label: "Emotion", data: analysis?.by_emotion },
    { id: "grade", label: "Grade", data: analysis?.by_grade },
    { id: "direction", label: "Direction", data: analysis?.by_direction },
    { id: "hour", label: "Hour", data: analysis?.by_hour },
    { id: "day", label: "Day", data: analysis?.by_day },
    { id: "timeframe", label: "Timeframe", data: analysis?.by_timeframe },
  ];

  const activeData = tabs.find(t => t.id === tab)?.data || [];

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <p className="w-fit rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1 text-sm text-purple-300">
              🔍 Edge Finder
            </p>
            <span className="rounded-full border border-green-500/30 bg-green-500/10 px-3 py-0.5 text-xs text-green-400">
              YOUR REAL DATA
            </span>
          </div>
          <h1 className="text-4xl font-bold">Find Your Edge</h1>
          <p className="mt-2 text-white/40">
            Every number here is calculated from your actual trades. No estimates, no invented statistics.
            Sample sizes are shown so you can judge what's real and what's noise.
          </p>
          {activeAccount && (
            <p className="mt-2 text-sm text-blue-400">
              Account: {activeAccount.account_name} #{activeAccount.account_number}
            </p>
          )}
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {["All", "Live", "Backtest", "Demo"].map(s => (
            <button
              key={s}
              onClick={() => setSource(s)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                source === s ? "bg-purple-600 text-white" : "bg-white/5 text-white/40 hover:bg-white/10"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <button
          onClick={analyze}
          disabled={loading}
          className="mb-8 w-full rounded-2xl bg-purple-600 py-4 text-lg font-semibold transition hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? "🤖 Analyzing your trades..." : `🔍 Analyze ${source === "All" ? "All" : source} Trades`}
        </button>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-400 text-sm">{error}</div>
        )}

        {analysis && (
          <div className="space-y-6">

            {analysis.sample_warning && (
              <div className="rounded-3xl border border-orange-500/30 bg-orange-500/5 p-5">
                <p className="text-sm text-orange-300">📏 {analysis.sample_warning}</p>
              </div>
            )}

            <div className="rounded-3xl border border-purple-500/30 bg-purple-500/5 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/50">{analysis.source_filter} trades</span>
              </div>
              <h2 className="text-2xl font-bold">{analysis.headline}</h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Stat label="Total Trades" value={String(analysis.overall.trades)} />
              <Stat label="Win Rate" value={`${analysis.overall.win_rate}%`} color={analysis.overall.win_rate >= 50 ? "text-green-400" : "text-red-400"} />
              <Stat label="Total P/L" value={`${analysis.overall.total_pl}`} color={analysis.overall.total_pl >= 0 ? "text-green-400" : "text-red-400"} />
              <Stat label="Expectancy / trade" value={`${analysis.overall.expectancy}`} color={analysis.overall.expectancy >= 0 ? "text-green-400" : "text-red-400"} />
              <Stat label="Profit Factor" value={String(analysis.overall.profit_factor)} color={Number(analysis.overall.profit_factor) >= 1 ? "text-green-400" : "text-red-400"} />
              <Stat label="Avg Win / Avg Loss" value={`${analysis.overall.avg_win} / ${analysis.overall.avg_loss}`} />
            </div>

            <div className="rounded-3xl border border-green-500/20 bg-green-500/5 p-6">
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-xl font-semibold text-green-400">✅ Your Edge</h2>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                  analysis.your_edge.is_significant ? "bg-green-500/20 text-green-400" : "bg-orange-500/20 text-orange-400"
                }`}>
                  {analysis.your_edge.sample_size} trades
                  {!analysis.your_edge.is_significant && " · not significant"}
                </span>
              </div>
              <p className="text-sm text-white/70 mb-3">{analysis.your_edge.finding}</p>
              {analysis.your_edge.caveat && (
                <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-3">
                  <p className="text-xs text-orange-300">⚠️ {analysis.your_edge.caveat}</p>
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-6">
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-xl font-semibold text-red-400">🩸 Your Biggest Leak</h2>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs">{analysis.your_leak.sample_size} trades</span>
              </div>
              <p className="text-sm text-white/70 mb-3">{analysis.your_leak.finding}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-black/30 p-3">
                  <p className="text-xs text-white/40 mb-1">Cost</p>
                  <p className="text-sm font-bold text-red-400">{analysis.your_leak.cost}</p>
                </div>
                <div className="rounded-2xl bg-black/30 p-3">
                  <p className="text-xs text-white/40 mb-1">Fix</p>
                  <p className="text-sm text-white/70">{analysis.your_leak.fix}</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-blue-500/20 bg-blue-500/5 p-6">
              <h2 className="mb-3 text-xl font-semibold text-blue-400">🎯 R:R Reality Check</h2>
              <div className="grid gap-3 sm:grid-cols-2 mb-3">
                <div className="rounded-2xl bg-black/30 p-3">
                  <p className="text-xs text-white/40">Planned R:R</p>
                  <p className="text-lg font-bold">{analysis.avg_planned_rr ?? "Not logged"}</p>
                </div>
                <div className="rounded-2xl bg-black/30 p-3">
                  <p className="text-xs text-white/40">Actually Achieved</p>
                  <p className={`text-lg font-bold ${
                    analysis.actual_rr && analysis.avg_planned_rr && analysis.actual_rr >= analysis.avg_planned_rr
                      ? "text-green-400" : "text-red-400"
                  }`}>{analysis.actual_rr ?? "N/A"}</p>
                </div>
              </div>
              <p className="text-sm text-white/60">{analysis.rr_reality}</p>
            </div>

            {analysis.stop_doing?.length > 0 && (
              <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-6">
                <h2 className="mb-4 text-xl font-semibold text-red-400">🛑 Stop Doing This</h2>
                <div className="space-y-2">
                  {analysis.stop_doing.map((s, i) => (
                    <p key={i} className="text-sm text-white/70">• {s}</p>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <h2 className="mb-4 text-xl font-semibold">📊 Breakdown</h2>
              <div className="mb-4 flex flex-wrap gap-2">
                {tabs.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                      tab === t.id ? "bg-purple-600 text-white" : "bg-white/5 text-white/40 hover:bg-white/10"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {activeData.length === 0 ? (
                <p className="text-sm text-white/30 text-center py-6">No data logged for this breakdown.</p>
              ) : (
                <div className="space-y-2">
                  {activeData.map((seg, i) => (
                    <div key={i} className={`rounded-2xl border p-4 ${
                      seg.total_pl >= 0 ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5"
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{seg.key}</span>
                          <span className={`rounded-full px-2 py-0.5 text-xs ${
                            seg.trades < 10 ? "bg-red-500/20 text-red-400" :
                            seg.trades < 20 ? "bg-orange-500/20 text-orange-400" :
                            "bg-green-500/20 text-green-400"
                          }`}>
                            {seg.trades} trades
                            {seg.trades < 10 ? " · noise" : seg.trades < 20 ? " · low" : ""}
                          </span>
                        </div>
                        <span className={`font-bold ${seg.total_pl >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {seg.total_pl >= 0 ? "+" : ""}{seg.total_pl}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-xl bg-black/30 p-2 text-center">
                          <p className="text-xs text-white/30">Win rate</p>
                          <p className="text-xs font-semibold">{seg.win_rate}%</p>
                        </div>
                        <div className="rounded-xl bg-black/30 p-2 text-center">
                          <p className="text-xs text-white/30">Expectancy</p>
                          <p className={`text-xs font-semibold ${seg.expectancy >= 0 ? "text-green-400" : "text-red-400"}`}>{seg.expectancy}</p>
                        </div>
                        <div className="rounded-xl bg-black/30 p-2 text-center">
                          <p className="text-xs text-white/30">Profit factor</p>
                          <p className="text-xs font-semibold">{seg.profit_factor}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Insight title="Session insight" text={analysis.session_insight} />
              <Insight title="Pair insight" text={analysis.pair_insight} />
              <Insight title="Time insight" text={analysis.time_insight} />
              <Insight title="Psychology insight" text={analysis.psychology_insight} />
            </div>

            {analysis.mistake_cost?.length > 0 && (
              <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-6">
                <h2 className="mb-4 text-xl font-semibold text-red-400">💸 What Your Mistakes Cost</h2>
                <div className="space-y-2">
                  {analysis.mistake_cost.map((m, i) => (
                    <div key={i} className="flex items-center justify-between rounded-2xl bg-black/30 p-3">
                      <div>
                        <p className="text-sm font-semibold">{m.key}</p>
                        <p className="text-xs text-white/30">{m.trades} trades</p>
                      </div>
                      <p className="font-bold text-red-400">{m.total_pl}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analysis.next_steps?.length > 0 && (
              <div className="rounded-3xl border border-blue-500/20 bg-blue-500/5 p-6">
                <h2 className="mb-4 text-xl font-semibold text-blue-400">✅ Next Steps</h2>
                <div className="space-y-2">
                  {analysis.next_steps.map((s, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-xl bg-white/5 p-3">
                      <span className="text-blue-400 font-bold">{i + 1}.</span>
                      <p className="text-sm text-white/70">{s}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analysis.overfitting_warning && (
              <div className="rounded-3xl border border-yellow-500/30 bg-yellow-500/5 p-6">
                <h2 className="mb-2 text-sm font-semibold text-yellow-400">⚠️ Read This Before You Act</h2>
                <p className="text-sm text-white/60">{analysis.overfitting_warning}</p>
              </div>
            )}

            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
              <p className="text-xs text-white/20 text-center">
                All statistics calculated from your real logged trades. Past performance does not predict future results.
                Small sample sizes produce false patterns — treat anything under 20 trades as unproven.
              </p>
            </div>

          </div>
        )}
      </div>
    </AppShell>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs text-white/40">{label}</p>
      <p className={`text-xl font-bold mt-1 ${color || "text-white"}`}>{value}</p>
    </div>
  );
}

function Insight({ title, text }: { title: string; text: string }) {
  if (!text) return null;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs font-semibold text-white/50 mb-1">{title}</p>
      <p className="text-sm text-white/60">{text}</p>
    </div>
  );
}