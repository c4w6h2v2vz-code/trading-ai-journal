"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AppShell from "@/components/AppShell";

type Trade = {
  id: string;
  pair: string;
  session: string;
  strategy: string | null;
  direction: string | null;
  grade: string | null;
  emotion: string | null;
  mistake: string | null;
  risk_reward: number | null;
  entry_price: number;
  exit_price: number;
  profit_loss: number;
  result: string;
  notes: string;
  created_at: string;
  ai_score: number | null;
};

export default function AnalyticsPage() {
  const router = useRouter();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data } = await supabase
        .from("trades")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setTrades(data || []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return (
    <AppShell>
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-white/40">Loading analytics...</p>
      </div>
    </AppShell>
  );

  // --- Calculations ---
  const total = trades.length;
  const wins = trades.filter(t => t.result === "Win").length;
  const losses = trades.filter(t => t.result === "Loss").length;
  const breakEvens = trades.filter(t => t.result === "Break Even").length;
  const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : "0";

  const totalPL = trades.reduce((sum, t) => sum + t.profit_loss, 0);
  const grossWins = trades.filter(t => t.profit_loss > 0).reduce((sum, t) => sum + t.profit_loss, 0);
  const grossLosses = Math.abs(trades.filter(t => t.profit_loss < 0).reduce((sum, t) => sum + t.profit_loss, 0));
  const profitFactor = grossLosses > 0 ? (grossWins / grossLosses).toFixed(2) : "∞";

  const avgWin = wins > 0 ? (grossWins / wins).toFixed(2) : "0";
  const avgLoss = losses > 0 ? (grossLosses / losses).toFixed(2) : "0";
  const expectancy = total > 0 ? ((wins / total) * Number(avgWin) - (losses / total) * Number(avgLoss)).toFixed(2) : "0";

  const avgRR = trades.filter(t => t.risk_reward).length > 0
    ? (trades.filter(t => t.risk_reward).reduce((sum, t) => sum + (t.risk_reward || 0), 0) / trades.filter(t => t.risk_reward).length).toFixed(2)
    : "N/A";

  const bestTrade = trades.reduce((best, t) => t.profit_loss > (best?.profit_loss || -Infinity) ? t : best, trades[0]);
  const worstTrade = trades.reduce((worst, t) => t.profit_loss < (worst?.profit_loss || Infinity) ? t : worst, trades[0]);

  const avgAiScore = trades.filter(t => t.ai_score).length > 0
    ? (trades.filter(t => t.ai_score).reduce((sum, t) => sum + (t.ai_score || 0), 0) / trades.filter(t => t.ai_score).length).toFixed(1)
    : "N/A";

  // Pair performance
  const pairMap: Record<string, { wins: number; total: number; pl: number }> = {};
  trades.forEach(t => {
    if (!pairMap[t.pair]) pairMap[t.pair] = { wins: 0, total: 0, pl: 0 };
    pairMap[t.pair].total++;
    pairMap[t.pair].pl += t.profit_loss;
    if (t.result === "Win") pairMap[t.pair].wins++;
  });
  const pairStats = Object.entries(pairMap).sort((a, b) => b[1].pl - a[1].pl);

  // Session performance
  const sessionMap: Record<string, { wins: number; total: number; pl: number }> = {};
  trades.forEach(t => {
    const s = t.session || "Unknown";
    if (!sessionMap[s]) sessionMap[s] = { wins: 0, total: 0, pl: 0 };
    sessionMap[s].total++;
    sessionMap[s].pl += t.profit_loss;
    if (t.result === "Win") sessionMap[s].wins++;
  });
  const sessionStats = Object.entries(sessionMap).sort((a, b) => b[1].pl - a[1].pl);

  // Day of week performance
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayMap: Record<string, { wins: number; total: number; pl: number }> = {};
  trades.forEach(t => {
    const day = days[new Date(t.created_at).getDay()];
    if (!dayMap[day]) dayMap[day] = { wins: 0, total: 0, pl: 0 };
    dayMap[day].total++;
    dayMap[day].pl += t.profit_loss;
    if (t.result === "Win") dayMap[day].wins++;
  });
  const dayStats = Object.entries(dayMap).sort((a, b) => b[1].pl - a[1].pl);

  // Monthly performance
  const monthMap: Record<string, { wins: number; total: number; pl: number }> = {};
  trades.forEach(t => {
    const month = new Date(t.created_at).toLocaleString("default", { month: "long", year: "numeric" });
    if (!monthMap[month]) monthMap[month] = { wins: 0, total: 0, pl: 0 };
    monthMap[month].total++;
    monthMap[month].pl += t.profit_loss;
    if (t.result === "Win") monthMap[month].wins++;
  });
  const monthStats = Object.entries(monthMap).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());

  // Mistake frequency
  const mistakeMap: Record<string, number> = {};
  trades.forEach(t => {
    if (t.mistake) {
      mistakeMap[t.mistake] = (mistakeMap[t.mistake] || 0) + 1;
    }
  });
  const mistakeStats = Object.entries(mistakeMap).sort((a, b) => b[1] - a[1]);

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-10">
          <p className="mb-3 w-fit rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1 text-sm text-blue-300">
            Advanced Analytics
          </p>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Performance Stats</h1>
          <p className="mt-3 text-white/50">Deep analysis of your trading performance.</p>
        </div>

        {total === 0 ? (
          <p className="text-white/40">No trades yet. Add trades to see analytics.</p>
        ) : (
          <>
            {/* Core Stats */}
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Total Trades" value={String(total)} />
              <StatCard label="Win Rate" value={`${winRate}%`} color="text-blue-400" />
              <StatCard label="Net P/L" value={`$${totalPL.toFixed(2)}`} color={totalPL >= 0 ? "text-green-400" : "text-red-400"} />
              <StatCard label="Profit Factor" value={String(profitFactor)} color="text-yellow-400" />
            </div>

            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Wins" value={String(wins)} color="text-green-400" />
              <StatCard label="Losses" value={String(losses)} color="text-red-400" />
              <StatCard label="Break Evens" value={String(breakEvens)} />
              <StatCard label="Avg AI Score" value={String(avgAiScore)} color="text-purple-400" />
            </div>

            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Expectancy" value={`$${expectancy}`} color="text-blue-400" />
              <StatCard label="Avg R:R" value={String(avgRR)} />
              <StatCard label="Avg Win" value={`$${avgWin}`} color="text-green-400" />
              <StatCard label="Avg Loss" value={`$${avgLoss}`} color="text-red-400" />
            </div>

            {/* Best & Worst */}
            <div className="mb-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-green-500/20 bg-green-500/5 p-6">
                <p className="mb-2 text-sm text-white/40">Best Trade</p>
                <p className="text-2xl font-bold text-green-400">${bestTrade?.profit_loss.toFixed(2)}</p>
                <p className="mt-1 text-sm text-white/60">{bestTrade?.pair} — {bestTrade?.result}</p>
              </div>
              <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-6">
                <p className="mb-2 text-sm text-white/40">Worst Trade</p>
                <p className="text-2xl font-bold text-red-400">${worstTrade?.profit_loss.toFixed(2)}</p>
                <p className="mt-1 text-sm text-white/60">{worstTrade?.pair} — {worstTrade?.result}</p>
              </div>
            </div>

            {/* Pair Performance */}
            <Section title="Pair Performance">
              {pairStats.map(([pair, stats]) => (
                <Row key={pair} label={pair} wins={stats.wins} total={stats.total} pl={stats.pl} />
              ))}
            </Section>

            {/* Session Performance */}
            <Section title="Session Performance">
              {sessionStats.map(([session, stats]) => (
                <Row key={session} label={session} wins={stats.wins} total={stats.total} pl={stats.pl} />
              ))}
            </Section>

            {/* Day Performance */}
            <Section title="Best Days to Trade">
              {dayStats.map(([day, stats]) => (
                <Row key={day} label={day} wins={stats.wins} total={stats.total} pl={stats.pl} />
              ))}
            </Section>

            {/* Monthly Performance */}
            <Section title="Monthly Performance">
              {monthStats.map(([month, stats]) => (
                <Row key={month} label={month} wins={stats.wins} total={stats.total} pl={stats.pl} />
              ))}
            </Section>

            {/* Mistake Frequency */}
            {mistakeStats.length > 0 && (
              <Section title="Most Common Mistakes">
                {mistakeStats.map(([mistake, count]) => (
                  <div key={mistake} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-white/80">{mistake}</p>
                    <span className="rounded-full bg-red-500/10 px-3 py-1 text-sm text-red-400">{count}x</span>
                  </div>
                ))}
              </Section>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <p className="text-sm text-white/40">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${color || "text-white"}`}>{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <h2 className="mb-4 text-xl font-semibold">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Row({ label, wins, total, pl }: { label: string; wins: number; total: number; pl: number }) {
  const wr = ((wins / total) * 100).toFixed(0);
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-black/30 p-4">
      <p className="font-semibold">{label}</p>
      <div className="flex gap-4 text-sm">
        <span className="text-white/40">{total} trades</span>
        <span className="text-blue-400">{wr}% WR</span>
        <span className={pl >= 0 ? "text-green-400" : "text-red-400"}>${pl.toFixed(2)}</span>
      </div>
    </div>
  );
}