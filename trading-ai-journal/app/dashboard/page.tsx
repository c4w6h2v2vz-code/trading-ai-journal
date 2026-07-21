"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AppShell from "@/components/AppShell";

type UnifiedTrade = {
  id: string;
  pair: string;
  session: string | null;
  direction: string | null;
  entry_price: number | null;
  exit_price: number | null;
  profit_loss: number;
  created_at: string;
  trade_date: string | null;
};

export default function DashboardPage() {
  const router = useRouter();
  const [trades, setTrades] = useState<UnifiedTrade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      // Manual live trades
      const { data: manualData } = await supabase
        .from("trades")
        .select("*")
        .eq("user_id", user.id)
        .eq("trade_source", "Live")
        .order("created_at", { ascending: false });

      // MT5 synced trades (active account only)
      const activeAccount = localStorage.getItem("active_account");
      const activeAccountNumber = activeAccount ? String(JSON.parse(activeAccount).account_number).trim() : null;

      let mt5Query = supabase.from("mt5_trades").select("*").eq("user_id", user.id);
      if (activeAccountNumber) mt5Query = mt5Query.eq("account", activeAccountNumber);
      const { data: mt5Data } = await mt5Query.order("created_at", { ascending: false });

      const manualMapped: UnifiedTrade[] = (manualData || []).map((t: any) => ({
        id: String(t.id),
        pair: t.pair,
        session: t.session,
        direction: t.direction,
        entry_price: t.entry_price,
        exit_price: t.exit_price,
        profit_loss: Number(t.profit_loss),
        created_at: t.created_at,
        trade_date: t.trade_date,
      }));

      const mt5Mapped: UnifiedTrade[] = (mt5Data || []).map((t: any) => ({
        id: "mt5-" + t.id,
        pair: t.symbol,
        session: "MT5",
        direction: t.trade_type === "SELL" ? "Sell" : "Buy",
        entry_price: t.entry_price,
        exit_price: t.exit_price,
        profit_loss: Number(t.profit),
        created_at: t.created_at,
        trade_date: t.close_time || t.created_at,
      }));

      const all = [...manualMapped, ...mt5Mapped].sort(
        (a, b) => new Date(b.trade_date || b.created_at).getTime() - new Date(a.trade_date || a.created_at).getTime()
      );

      setTrades(all);
      setLoading(false);
    }
    load();
  }, []);

  // Stats
  const total = trades.length;
  const wins = trades.filter(t => t.profit_loss > 0);
  const losses = trades.filter(t => t.profit_loss < 0);
  const totalPL = trades.reduce((s, t) => s + Number(t.profit_loss), 0);
  const winRate = total > 0 ? ((wins.length / total) * 100).toFixed(1) : "0";
  const grossWins = wins.reduce((s, t) => s + Number(t.profit_loss), 0);
  const grossLosses = Math.abs(losses.reduce((s, t) => s + Number(t.profit_loss), 0));
  const profitFactor = grossLosses > 0 ? (grossWins / grossLosses).toFixed(2) : (grossWins > 0 ? "∞" : "0");
  const expectancy = total > 0 ? (totalPL / total).toFixed(2) : "0";
  const avgWin = wins.length > 0 ? (grossWins / wins.length).toFixed(2) : "0";
  const avgLoss = losses.length > 0 ? (grossLosses / losses.length).toFixed(2) : "0";

  const todayStr = new Date().toDateString();
  const todayTrades = trades.filter(t => new Date(t.trade_date || t.created_at).toDateString() === todayStr);
  const todayPL = todayTrades.reduce((s, t) => s + Number(t.profit_loss), 0);
  const tradesToday = todayTrades.length;

  const recentTrades = trades.slice(0, 6);

  if (loading) return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6 h-20 w-64 animate-pulse rounded-2xl bg-white/[0.04]" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/[0.04]" />)}
        </div>
      </div>
    </AppShell>
  );

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-blue-400">Overview</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">Dashboard</h1>
            <p className="mt-1 text-sm text-white/40">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
          <div className={`rounded-2xl border px-5 py-3 text-right ${
            totalPL >= 0 ? "border-emerald-500/20 bg-emerald-500/[0.07]" : "border-red-500/20 bg-red-500/[0.07]"
          }`}>
            <p className="text-xs font-medium uppercase tracking-wide text-white/40">Net P/L</p>
            <p className={`mt-0.5 text-2xl font-semibold tabular-nums ${totalPL >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {totalPL >= 0 ? "+" : "-"}${Math.abs(totalPL).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Primary stats */}
        <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Today's P/L" value={`${todayPL >= 0 ? "+" : "-"}$${Math.abs(todayPL).toFixed(2)}`} tone={todayPL >= 0 ? "pos" : "neg"} sub={`${tradesToday} trade${tradesToday === 1 ? "" : "s"} today`} />
          <StatCard label="Win Rate" value={`${winRate}%`} tone={Number(winRate) >= 50 ? "pos" : "neutral"} sub={`${wins.length}W / ${losses.length}L`} />
          <StatCard label="Profit Factor" value={profitFactor} tone={Number(profitFactor) >= 1 ? "pos" : "neg"} sub="gross win / loss" />
          <StatCard label="Expectancy" value={`$${expectancy}`} tone={Number(expectancy) >= 0 ? "pos" : "neg"} sub="per trade" />
        </div>

        {/* Secondary stats */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total Trades" value={String(total)} tone="neutral" />
          <StatCard label="Avg Win" value={`$${avgWin}`} tone="pos" />
          <StatCard label="Avg Loss" value={`$${avgLoss}`} tone="neg" />
          <StatCard label="Wins / Losses" value={`${wins.length}/${losses.length}`} tone="neutral" />
        </div>

        {/* Recent trades */}
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white/80">Recent Trades</h2>
            <button onClick={() => router.push("/journal")} className="text-xs text-blue-400 hover:text-blue-300">See all →</button>
          </div>

          {recentTrades.length === 0 ? (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-10 text-center">
              <p className="mb-2 text-3xl opacity-40">📊</p>
              <p className="text-sm text-white/40">No trades yet. Connect MT5 or add one manually.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
              {recentTrades.map((trade, i) => (
                <div key={trade.id} className={`flex items-center justify-between px-4 py-3 ${i !== recentTrades.length - 1 ? "border-b border-white/[0.04]" : ""}`}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04] text-xs font-semibold text-white/60">
                      {trade.pair?.slice(0, 3) || "—"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{trade.pair}</p>
                      <p className="text-xs text-white/30">{trade.session === "MT5" ? "Synced" : trade.session || "Manual"}</p>
                    </div>
                  </div>
                  <p className={`text-sm font-semibold tabular-nums ${trade.profit_loss >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {trade.profit_loss >= 0 ? "+" : "-"}${Math.abs(trade.profit_loss).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <QuickAction icon="📝" label="Add Trade" onClick={() => router.push("/journal")} />
          <QuickAction icon="🌅" label="Morning Brief" onClick={() => router.push("/morning-brief")} />
          <QuickAction icon="🔍" label="Edge Finder" onClick={() => router.push("/edge-finder")} />
          <QuickAction icon="🏦" label="Prop Firm" onClick={() => router.push("/prop-firm")} />
        </div>
      </div>
    </AppShell>
  );
}

function StatCard({ label, value, tone, sub }: { label: string; value: string; tone: "pos" | "neg" | "neutral"; sub?: string }) {
  const color = tone === "pos" ? "text-emerald-400" : tone === "neg" ? "text-red-400" : "text-white";
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-white/35">{label}</p>
      <p className={`mt-1.5 text-2xl font-semibold tabular-nums ${color}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-white/30">{sub}</p>}
    </div>
  );
}

function QuickAction({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-left transition-all hover:border-white/[0.12] hover:bg-white/[0.04]">
      <p className="mb-2 text-xl opacity-80 transition-transform group-hover:scale-110">{icon}</p>
      <p className="text-sm font-medium text-white/70 group-hover:text-white">{label}</p>
    </button>
  );
}