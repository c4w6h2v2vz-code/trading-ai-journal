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
        .order("created_at", { ascending: false });

      setTrades(data || []);
    }

    loadTrades();
  }, []);

  const totalTrades = trades.length;
  const wins = trades.filter((trade) => trade.result === "Win").length;
  const losses = trades.filter((trade) => trade.result === "Loss").length;
  const totalProfit = trades.reduce(
    (sum, trade) => sum + Number(trade.profit_loss),
    0
  );
  const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : "0";

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-400 mb-8">Your trading performance overview.</p>

        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card title="Total Trades" value={totalTrades.toString()} />
          <Card title="Wins" value={wins.toString()} />
          <Card title="Losses" value={losses.toString()} />
          <Card title="Win Rate" value={`${winRate}%`} />
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 mb-8">
          <p className="text-gray-400">Total Profit / Loss</p>
          <h2 className="text-4xl font-bold mt-2">{totalProfit}</h2>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-2xl font-semibold mb-6">Recent Trades</h2>

          {trades.length === 0 ? (
            <p className="text-gray-400">No trades found yet.</p>
          ) : (
            <div className="space-y-3">
              {trades.map((trade) => (
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

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <p className="text-gray-400">{title}</p>
      <h2 className="text-3xl font-bold mt-2">{value}</h2>
    </div>
  );
}