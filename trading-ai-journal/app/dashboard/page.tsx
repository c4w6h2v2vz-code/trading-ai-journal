"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AppShell from "@/components/AppShell";

type Trade = {
  id: string;
  pair: string;
  session: string;
  entry_price: number;
  exit_price: number;
  profit_loss: number;
  result: string;
  notes: string;
  created_at: string;
};

export default function DashboardPage() {
  const [trades, setTrades] = useState<Trade[]>([]);

  useEffect(() => {
    async function loadTrades() {
      const { data } = await supabase
        .from("trades")
        .select("*")
        .order("created_at", { ascending: true });

      setTrades(data || []);
    }

    loadTrades();
  }, []);

  const totalTrades = trades.length;
  const wins = trades.filter((trade) => trade.result === "Win");
  const losses = trades.filter((trade) => trade.result === "Loss");

  const totalProfit = trades.reduce(
    (sum, trade) => sum + Number(trade.profit_loss),
    0
  );

  const winRate =
    totalTrades > 0 ? ((wins.length / totalTrades) * 100).toFixed(1) : "0";

  const averageWin =
    wins.length > 0
      ? (
          wins.reduce((sum, trade) => sum + Number(trade.profit_loss), 0) /
          wins.length
        ).toFixed(1)
      : "0";

  const averageLoss =
    losses.length > 0
      ? (
          losses.reduce((sum, trade) => sum + Number(trade.profit_loss), 0) /
          losses.length
        ).toFixed(1)
      : "0";

  const bestTrade =
    trades.length > 0
      ? Math.max(...trades.map((trade) => Number(trade.profit_loss)))
      : 0;

  const worstTrade =
    trades.length > 0
      ? Math.min(...trades.map((trade) => Number(trade.profit_loss)))
      : 0;

  const bestPair = getBestGroup(trades, "pair");
  const bestSession = getBestGroup(trades, "session");

  let runningProfit = 0;
  const equityCurve = trades.map((trade) => {
    runningProfit += Number(trade.profit_loss);
    return runningProfit;
  });

  const maxEquity = Math.max(...equityCurve.map((v) => Math.abs(v)), 1);
  const recentTrades = [...trades].reverse().slice(0, 6);

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 w-fit rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1 text-sm text-blue-300">
              Professional Trading Analytics
            </p>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              Performance Dashboard
            </h1>
            <p className="mt-3 text-white/50">
              Track your wins, losses, sessions, pairs, and equity growth.
            </p>
          </div>

          <div
            className={`rounded-2xl border px-5 py-4 ${
              totalProfit >= 0
                ? "border-green-500/20 bg-green-500/10"
                : "border-red-500/20 bg-red-500/10"
            }`}
          >
            <p className="text-sm text-white/50">Net P/L</p>
            <p
              className={`text-3xl font-bold ${
                totalProfit >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {totalProfit}
            </p>
          </div>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Trades" value={totalTrades.toString()} />
          <StatCard title="Win Rate" value={`${winRate}%`} highlight="blue" />
          <StatCard title="Wins" value={wins.length.toString()} highlight="green" />
          <StatCard title="Losses" value={losses.length.toString()} highlight="red" />
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Best Trade" value={bestTrade.toString()} highlight="green" />
          <StatCard title="Worst Trade" value={worstTrade.toString()} highlight="red" />
          <StatCard title="Average Win" value={averageWin} />
          <StatCard title="Average Loss" value={averageLoss} />
        </div>

        <div className="mb-8 grid gap-4 lg:grid-cols-3">
          <InfoCard title="Best Pair" value={bestPair} />
          <InfoCard title="Best Session" value={bestSession} />
          <InfoCard
            title="AI Coach Note"
            value={
              totalTrades === 0
                ? "Add more trades to unlock better insights."
                : wins.length > losses.length
                ? "Your performance is positive. Keep tracking rules and psychology."
                : "Review your losing trades and reduce repeated mistakes."
            }
          />
        </div>

        <div className="mb-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/40">
          <h2 className="text-2xl font-semibold">Equity Curve</h2>
          <p className="mb-6 text-sm text-white/40">
            Your running profit/loss over time.
          </p>

          {equityCurve.length === 0 ? (
            <p className="text-white/40">No data yet.</p>
          ) : (
            <div className="flex h-72 items-end gap-2 rounded-2xl border border-white/10 bg-black/40 p-4">
              {equityCurve.map((value, index) => (
                <div
                  key={index}
                  className={`flex-1 rounded-t-xl ${
                    value >= 0 ? "bg-green-500" : "bg-red-500"
                  }`}
                  style={{
                    height: `${Math.max(8, (Math.abs(value) / maxEquity) * 100)}%`,
                  }}
                  title={`Trade ${index + 1}: ${value}`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/40">
          <h2 className="text-2xl font-semibold">Recent Trades</h2>
          <p className="mb-6 text-sm text-white/40">Latest saved trades.</p>

          {recentTrades.length === 0 ? (
            <p className="text-white/40">No trades found yet.</p>
          ) : (
            <div className="space-y-3">
              {recentTrades.map((trade) => (
                <div
                  key={trade.id}
                  className="rounded-2xl border border-white/10 bg-black/40 p-4 transition hover:border-white/20"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold">{trade.pair}</p>
                      <p className="text-sm text-white/40">{trade.session}</p>
                    </div>

                    <div className="text-right">
                      <p
                        className={`text-lg font-bold ${
                          trade.profit_loss >= 0
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {trade.profit_loss}
                      </p>
                      <p className="text-sm text-white/40">{trade.result}</p>
                    </div>
                  </div>

                  {trade.notes && (
                    <p className="mt-3 rounded-xl bg-white/[0.03] p-3 text-sm text-white/50">
                      {trade.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function getBestGroup(trades: Trade[], key: "pair" | "session") {
  const groups: Record<string, number> = {};

  trades.forEach((trade) => {
    const groupName = trade[key] || "Unknown";
    groups[groupName] = (groups[groupName] || 0) + Number(trade.profit_loss);
  });

  const sorted = Object.entries(groups).sort((a, b) => b[1] - a[1]);

  return sorted.length > 0 ? `${sorted[0][0]} (${sorted[0][1]})` : "No data";
}

function StatCard({
  title,
  value,
  highlight,
}: {
  title: string;
  value: string;
  highlight?: "green" | "red" | "blue";
}) {
  const color =
    highlight === "green"
      ? "text-green-400"
      : highlight === "red"
      ? "text-red-400"
      : highlight === "blue"
      ? "text-blue-400"
      : "text-white";

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/30">
      <p className="text-sm text-white/40">{title}</p>
      <h2 className={`mt-3 text-3xl font-bold ${color}`}>{value}</h2>
    </div>
  );
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/30">
      <p className="text-sm text-white/40">{title}</p>
      <h2 className="mt-3 text-xl font-bold text-white">{value}</h2>
    </div>
  );
}