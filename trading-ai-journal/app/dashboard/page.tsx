"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

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

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-4xl font-bold mb-2">Analytics Dashboard</h1>
        <p className="text-gray-400 mb-8">
          Track your trading performance like a professional.
        </p>

        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card title="Total Trades" value={totalTrades.toString()} />
          <Card title="Win Rate" value={`${winRate}%`} />
          <Card title="Total Profit" value={totalProfit.toString()} />
          <Card title="Best Trade" value={bestTrade.toString()} />
        </div>

        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card title="Wins" value={wins.length.toString()} />
          <Card title="Losses" value={losses.length.toString()} />
          <Card title="Average Win" value={averageWin} />
          <Card title="Average Loss" value={averageLoss} />
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card title="Worst Trade" value={worstTrade.toString()} />
          <Card title="Best Pair" value={bestPair} />
          <Card title="Best Session" value={bestSession} />
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-6">Equity Curve</h2>

          {equityCurve.length === 0 ? (
            <p className="text-gray-400">No data yet.</p>
          ) : (
            <div className="flex items-end gap-2 h-64 border-b border-white/10">
              {equityCurve.map((value, index) => (
                <div
                  key={index}
                  className="flex-1 rounded-t bg-blue-600"
                  style={{
                    height: `${Math.max(10, Math.abs(value))}%`,
                  }}
                  title={`Trade ${index + 1}: ${value}`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-2xl font-semibold mb-6">Recent Trades</h2>

          {trades.length === 0 ? (
            <p className="text-gray-400">No trades found yet.</p>
          ) : (
            <div className="space-y-3">
              {[...trades].reverse().map((trade) => (
                <div
                  key={trade.id}
                  className="rounded-xl border border-white/10 bg-black/40 p-4"
                >
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="font-semibold">{trade.pair}</p>
                      <p className="text-sm text-gray-400">{trade.session}</p>
                    </div>

                    <div className="text-right">
                      <p
                        className={
                          trade.profit_loss >= 0
                            ? "text-green-400"
                            : "text-red-400"
                        }
                      >
                        {trade.profit_loss}
                      </p>
                      <p className="text-sm text-gray-400">{trade.result}</p>
                    </div>
                  </div>

                  {trade.notes && (
                    <p className="mt-3 text-sm text-gray-400">{trade.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
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

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <p className="text-gray-400">{title}</p>
      <h2 className="text-3xl font-bold mt-2">{value}</h2>
    </div>
  );
}