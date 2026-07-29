"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AppShell from "@/components/AppShell";

type Trade = {
  id: string;
  pair: string;
  profit_loss: number;
  trade_date: string | null;
  created_at: string;
};

type DayResult = {
  date: string;
  dayPL: number;
  cumulativePL: number;
  equity: number;
  breachedDaily: boolean;
  breachedMaxDD: boolean;
  trades: number;
};

const PRESETS: Record<string, { size: number; target: number; daily: number; maxDD: number; days: number }> = {
  "FTMO 10k (Phase 1)": { size: 10000, target: 10, daily: 5, maxDD: 10, days: 30 },
  "The5ers 10k": { size: 10000, target: 8, daily: 5, maxDD: 10, days: 30 },
  "Custom": { size: 10000, target: 10, daily: 5, maxDD: 10, days: 30 },
};

export default function ChallengeSimulatorPage() {
  const router = useRouter();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  const [preset, setPreset] = useState("The5ers 10k");
  const [size, setSize] = useState(10000);
  const [target, setTarget] = useState(8);
  const [daily, setDaily] = useState(5);
  const [maxDD, setMaxDD] = useState(10);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [result, setResult] = useState<{ days: DayResult[]; verdict: string; reason: string } | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data } = await supabase
        .from("trades")
        .select("id, pair, profit_loss, trade_date, created_at")
        .eq("user_id", user.id)
        .eq("trade_source", "Backtest")
        .order("trade_date", { ascending: true });

      const list = (data || []).map((t: any) => ({
        id: String(t.id),
        pair: t.pair,
        profit_loss: Number(t.profit_loss),
        trade_date: t.trade_date,
        created_at: t.created_at,
      }));
      setTrades(list);

      // Default date range = full span of backtest trades
      if (list.length > 0) {
        const dates = list.map(t => (t.trade_date || t.created_at).slice(0, 10)).sort();
        setFromDate(dates[0]);
        setToDate(dates[dates.length - 1]);
      }
      setLoading(false);
    }
    load();
  }, []);

  function applyPreset(name: string) {
    setPreset(name);
    const p = PRESETS[name];
    if (p) {
      setSize(p.size);
      setTarget(p.target);
      setDaily(p.daily);
      setMaxDD(p.maxDD);
    }
  }

  function runSimulation() {
    // Filter trades to date range
    const inRange = trades.filter(t => {
      const d = (t.trade_date || t.created_at).slice(0, 10);
      return (!fromDate || d >= fromDate) && (!toDate || d <= toDate);
    });

    if (inRange.length === 0) {
      setResult({ days: [], verdict: "NO DATA", reason: "No backtest trades in this date range." });
      return;
    }

    // Group by day
    const byDay: Record<string, Trade[]> = {};
    inRange.forEach(t => {
      const d = (t.trade_date || t.created_at).slice(0, 10);
      if (!byDay[d]) byDay[d] = [];
      byDay[d].push(t);
    });

    const dailyLimit = (size * daily) / 100;
    const maxDDLimit = (size * maxDD) / 100;
    const targetAmount = (size * target) / 100;

    const sortedDays = Object.keys(byDay).sort();
    const days: DayResult[] = [];
    let cumulative = 0;
    let peakEquity = size;

    let verdict = "IN PROGRESS";
    let reason = "";
    let ended = false;

    for (const date of sortedDays) {
      if (ended) break;
      const dayTrades = byDay[date];
      const dayPL = dayTrades.reduce((s, t) => s + t.profit_loss, 0);
      cumulative += dayPL;
      const equity = size + cumulative;

      // Track peak for trailing/max drawdown
      if (equity > peakEquity) peakEquity = equity;
      const drawdownFromPeak = peakEquity - equity;
      const drawdownFromStart = size - equity;

      const breachedDaily = dayPL <= -dailyLimit;
      // Max drawdown: breach if equity falls more than maxDD below starting balance
      const breachedMaxDD = drawdownFromStart >= maxDDLimit;

      days.push({
        date,
        dayPL,
        cumulativePL: cumulative,
        equity,
        breachedDaily,
        breachedMaxDD,
        trades: dayTrades.length,
      });

      if (breachedDaily) {
        verdict = "FAILED";
        reason = `Daily loss limit breached on ${date}: lost $${Math.abs(dayPL).toFixed(2)} (limit is $${dailyLimit.toFixed(2)}).`;
        ended = true;
      } else if (breachedMaxDD) {
        verdict = "FAILED";
        reason = `Max drawdown breached on ${date}: down $${drawdownFromStart.toFixed(2)} from start (limit is $${maxDDLimit.toFixed(2)}).`;
        ended = true;
      } else if (cumulative >= targetAmount) {
        verdict = "PASSED";
        reason = `Profit target of $${targetAmount.toFixed(2)} reached on ${date} (total profit $${cumulative.toFixed(2)}).`;
        ended = true;
      }
    }

    if (!ended) {
      if (cumulative >= targetAmount) {
        verdict = "PASSED";
        reason = `Profit target of $${targetAmount.toFixed(2)} reached — final profit $${cumulative.toFixed(2)}. No rules breached.`;
      } else {
        verdict = "NOT REACHED";
        reason = `In this date range, no rules were breached, but the profit target of $${targetAmount.toFixed(2)} was NOT reached. Final profit: $${cumulative.toFixed(2)} (short by $${(targetAmount - cumulative).toFixed(2)}).`;
      }
    }

    setResult({ days, verdict, reason });
  }

  if (loading) return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="h-64 animate-pulse rounded-2xl bg-white/[0.04]" />
      </div>
    </AppShell>
  );

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6">
          <p className="text-xs font-medium uppercase tracking-wider text-purple-400">Backtest Tool</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Challenge Simulator</h1>
          <p className="mt-1 text-sm text-white/40">
            Test whether your backtest trades would pass a prop firm challenge's rules — before you pay for a real one.
          </p>
        </div>

        <div className="mb-4 rounded-2xl border border-yellow-500/20 bg-yellow-500/[0.06] p-4">
          <p className="text-xs text-yellow-300">
            This simulates the rules against your backtest trades. It does not prove you'd pass a real challenge — backtests have no live psychology or real fills. It shows whether your strategy's numbers would survive the rules.
          </p>
        </div>

        {trades.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-10 text-center">
            <p className="mb-2 text-3xl opacity-40">🧪</p>
            <p className="text-sm text-white/40">No backtest trades yet. Log some in <button onClick={() => router.push("/backtest")} className="text-purple-400 underline">Backtest Lab</button> first.</p>
          </div>
        ) : (
          <>
            {/* Rules setup */}
            <div className="mb-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <h3 className="mb-3 text-sm font-semibold text-white/80">Challenge Rules</h3>

              <div className="mb-3 flex flex-wrap gap-2">
                {Object.keys(PRESETS).map(name => (
                  <button
                    key={name}
                    onClick={() => applyPreset(name)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${preset === name ? "bg-purple-600 text-white" : "bg-white/[0.05] text-white/40 hover:bg-white/10"}`}
                  >
                    {name}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Field label="Account Size ($)" value={size} onChange={setSize} />
                <Field label="Profit Target (%)" value={target} onChange={setTarget} />
                <Field label="Daily Loss (%)" value={daily} onChange={setDaily} />
                <Field label="Max Drawdown (%)" value={maxDD} onChange={setMaxDD} />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-white/40">From date</label>
                  <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/50 p-2 text-sm text-white outline-none focus:border-purple-500" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-white/40">To date</label>
                  <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/50 p-2 text-sm text-white outline-none focus:border-purple-500" />
                </div>
              </div>

              <button onClick={runSimulation} className="mt-4 w-full rounded-xl bg-purple-600 py-3 text-sm font-semibold hover:bg-purple-500">
                Run Simulation
              </button>
            </div>

            {/* Result */}
            {result && (
              <div className="space-y-4">
                <div className={`rounded-2xl border p-5 ${
                  result.verdict === "PASSED" ? "border-emerald-500/30 bg-emerald-500/[0.08]" :
                  result.verdict === "FAILED" ? "border-red-500/30 bg-red-500/[0.08]" :
                  "border-yellow-500/30 bg-yellow-500/[0.08]"
                }`}>
                  <p className="text-xs font-medium uppercase tracking-wide text-white/40">
                    Verdict for {fromDate} to {toDate}
                  </p>
                  <p className={`mt-1 text-3xl font-bold ${
                    result.verdict === "PASSED" ? "text-emerald-400" :
                    result.verdict === "FAILED" ? "text-red-400" :
                    result.verdict === "NOT REACHED" ? "text-yellow-400" :
                    "text-white/50"
                  }`}>
                    {result.verdict === "PASSED" ? "✅ PASSED" :
                     result.verdict === "FAILED" ? "❌ FAILED — Account Blown" :
                     result.verdict === "NOT REACHED" ? "⚠️ Target Not Reached" :
                     "NO DATA"}
                  </p>
                  <p className="mt-2 text-sm text-white/70">{result.reason}</p>
                </div>

                {result.days.length > 0 && (
                  <div className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10 text-left text-xs text-white/40">
                          <th className="p-3">Date</th>
                          <th className="p-3 text-right">Day P/L</th>
                          <th className="p-3 text-right">Cumulative</th>
                          <th className="p-3 text-right">Equity</th>
                          <th className="p-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.days.map((d, i) => (
                          <tr key={i} className="border-b border-white/5">
                            <td className="p-3 text-xs">{new Date(d.date + "T12:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</td>
                            <td className={`p-3 text-right tabular-nums ${d.dayPL >= 0 ? "text-emerald-400" : "text-red-400"}`}>{d.dayPL >= 0 ? "+" : ""}{d.dayPL.toFixed(2)}</td>
                            <td className={`p-3 text-right tabular-nums ${d.cumulativePL >= 0 ? "text-emerald-400" : "text-red-400"}`}>{d.cumulativePL >= 0 ? "+" : ""}{d.cumulativePL.toFixed(2)}</td>
                            <td className="p-3 text-right tabular-nums text-white/60">${d.equity.toFixed(0)}</td>
                            <td className="p-3 text-center">
                              {d.breachedDaily ? <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400">Daily breach</span> :
                               d.breachedMaxDD ? <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400">Max DD breach</span> :
                               <span className="text-xs text-white/20">ok</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

function Field({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-white/40">{label}</label>
      <input type="number" step="any" value={value} onChange={e => onChange(Number(e.target.value))} className="w-full rounded-xl border border-white/10 bg-black/50 p-2 text-sm text-white outline-none focus:border-purple-500" />
    </div>
  );
}