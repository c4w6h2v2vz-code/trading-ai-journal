"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AppShell from "@/components/AppShell";

type Trade = {
  id: string;
  pair: string;
  result: string;
  profit_loss: number;
  session: string;
  strategy: string | null;
  direction: string | null;
  risk_reward: number | null;
  created_at: string;
  ai_score: number | null;
  ai_feedback: string | null;
};

export default function DashboardPage() {
  const router = useRouter();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const activeAccount = localStorage.getItem("active_account");
      const activeAccountNumber = activeAccount ? JSON.parse(activeAccount).account_number : null;

      const { data: manualTrades } = await supabase
        .from("trades").select("*").eq("user_id", user.id)
        .order("created_at", { ascending: true });

      let mt5Query = supabase
        .from("mt5_trades").select("*").eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (activeAccountNumber) {
        mt5Query = mt5Query.eq("account", activeAccountNumber);
      }

      const { data: mt5Data } = await mt5Query;

      const mt5Mapped = (mt5Data || []).map((t) => ({
        id: String(t.id),
        pair: t.symbol,
        session: "MT5",
        strategy: "MT5 Import",
        direction: t.trade_type === "SELL" ? "Sell" : "Buy",
        grade: null,
        emotion: null,
        mistake: null,
        risk_reward: null,
        entry_price: t.entry_price,
        exit_price: t.exit_price,
        profit_loss: t.profit,
        result: t.profit > 0 ? "Win" : t.profit < 0 ? "Loss" : "Break Even",
        notes: "",
        image_url: null,
        created_at: t.open_time || new Date().toISOString(),
        ai_score: t.ai_score,
        ai_feedback: t.ai_feedback,
      }));

      const allTrades = [...(manualTrades || []), ...mt5Mapped];
      setTrades(allTrades);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 h-24 animate-pulse" />
          ))}
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 h-32 animate-pulse mb-4" />
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 h-16 animate-pulse" />
          ))}
        </div>
      </div>
    </AppShell>
  );

  // Calculations
  const total = trades.length;
  const wins = trades.filter(t => t.result === "Win");
  const losses = trades.filter(t => t.result === "Loss");
  const totalPL = trades.reduce((sum, t) => sum + Number(t.profit_loss), 0);
  const winRate = total > 0 ? ((wins.length / total) * 100).toFixed(1) : "0";
  const grossWins = wins.reduce((sum, t) => sum + Number(t.profit_loss), 0);
  const grossLosses = Math.abs(losses.reduce((sum, t) => sum + Number(t.profit_loss), 0));
  const profitFactor = grossLosses > 0 ? (grossWins / grossLosses).toFixed(2) : "∞";
  const avgWin = wins.length > 0 ? (grossWins / wins.length).toFixed(2) : "0";
  const avgLoss = losses.length > 0 ? (grossLosses / losses.length).toFixed(2) : "0";
  const expectancy = total > 0
    ? ((wins.length / total) * Number(avgWin) - (losses.length / total) * Number(avgLoss)).toFixed(2)
    : "0";

  const recentTrades = [...trades].reverse().slice(0, 5);

  const today = new Date().toDateString();
  const todayPL = trades
    .filter(t => new Date(t.created_at).toDateString() === today)
    .reduce((sum, t) => sum + Number(t.profit_loss), 0);

  const avgAiScore = trades.filter(t => t.ai_score).length > 0
    ? (trades.filter(t => t.ai_score).reduce((sum, t) => sum + (t.ai_score || 0), 0) / trades.filter(t => t.ai_score).length).toFixed(1)
    : "N/A";

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-6">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-sm text-white/40">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
          </div>
          <div className={`rounded-2xl px-4 py-2 text-right ${totalPL >= 0 ? "bg-green-500/10 border border-green-500/20" : "bg-red-500/10 border border-red-500/20"}`}>
            <p className="text-xs text-white/40">Net P/L</p>
            <p className={`text-lg font-bold ${totalPL >= 0 ? "text-green-400" : "text-red-400"}`}>
              ${totalPL.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Today's P/L banner */}
        <div className={`mb-4 rounded-3xl border p-4 ${todayPL >= 0 ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5"}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/40">Today's P/L</p>
              <p className={`text-2xl font-bold ${todayPL >= 0 ? "text-green-400" : "text-red-400"}`}>
                ${todayPL.toFixed(2)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-white/40">Trades today</p>
              <p className="text-2xl font-bold">
                {trades.filter(t => new Date(t.created_at).toDateString() === today).length}
              </p>
            </div>
          </div>
        </div>

        {/* Core stats — 2x2 grid */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          <StatCard label="Win Rate" value={`${winRate}%`} color="text-blue-400" />
          <StatCard label="Total Trades" value={String(total)} />
          <StatCard label="Wins" value={String(wins.length)} color="text-green-400" />
          <StatCard label="Losses" value={String(losses.length)} color="text-red-400" />
        </div>

        {/* Second row stats */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          <StatCard label="Profit Factor" value={String(profitFactor)} color="text-yellow-400" />
          <StatCard label="Expectancy" value={`$${expectancy}`} color={Number(expectancy) >= 0 ? "text-green-400" : "text-red-400"} />
          <StatCard label="Avg Win" value={`$${avgWin}`} color="text-green-400" />
          <StatCard label="Avg Loss" value={`$${avgLoss}`} color="text-red-400" />
        </div>

        {/* AI Score */}
        {avgAiScore !== "N/A" && (
          <div className="mb-4 rounded-3xl border border-purple-500/20 bg-purple-500/5 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/40">Avg AI Score</p>
                <p className="text-3xl font-bold text-purple-400">{avgAiScore}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-white/40">out of 100</p>
                <p className="text-sm text-white/40 mt-1">
                  {Number(avgAiScore) >= 80 ? "🔥 Excellent" : Number(avgAiScore) >= 60 ? "👍 Good" : "⚠️ Needs work"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Recent Trades */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recent Trades</h2>
            <button
              onClick={() => router.push("/journal")}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              See all →
            </button>
          </div>

          {recentTrades.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-4xl mb-3">📈</p>
              <p className="text-white/40 text-sm">No trades yet.</p>
              <button
                onClick={() => router.push("/journal")}
                className="mt-3 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold"
              >
                Add First Trade
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTrades.map((trade) => (
                <div key={trade.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 p-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${trade.result === "Win" ? "bg-green-400" : trade.result === "Loss" ? "bg-red-400" : "bg-white/40"}`} />
                    <div>
                      <p className="font-semibold text-sm">{trade.pair}</p>
                      <p className="text-xs text-white/40">{trade.session}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-sm ${Number(trade.profit_loss) >= 0 ? "text-green-400" : "text-red-400"}`}>
                      ${Number(trade.profit_loss).toFixed(2)}
                    </p>
                    {trade.ai_score && (
                      <p className="text-xs text-purple-400">AI {trade.ai_score}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push("/journal")}
            className="rounded-3xl border border-blue-500/20 bg-blue-500/10 p-4 text-left hover:bg-blue-500/20 transition"
          >
            <p className="text-xl mb-1">📝</p>
            <p className="font-semibold text-sm text-blue-400">Add Trade</p>
          </button>
          <button
            onClick={() => router.push("/market-analysis")}
            className="rounded-3xl border border-green-500/20 bg-green-500/10 p-4 text-left hover:bg-green-500/20 transition"
          >
            <p className="text-xl mb-1">📊</p>
            <p className="font-semibold text-sm text-green-400">Market Analysis</p>
          </button>
          <button
            onClick={() => router.push("/daily-journal")}
            className="rounded-3xl border border-purple-500/20 bg-purple-500/10 p-4 text-left hover:bg-purple-500/20 transition"
          >
            <p className="text-xl mb-1">📓</p>
            <p className="font-semibold text-sm text-purple-400">Daily Journal</p>
          </button>
          <button
            onClick={() => router.push("/prop-firm")}
            className="rounded-3xl border border-orange-500/20 bg-orange-500/10 p-4 text-left hover:bg-orange-500/20 transition"
          >
            <p className="text-xl mb-1">🏦</p>
            <p className="font-semibold text-sm text-orange-400">Prop Firm</p>
          </button>
        </div>

      </div>
    </AppShell>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs text-white/40">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color || "text-white"}`}>{value}</p>
    </div>
  );
}