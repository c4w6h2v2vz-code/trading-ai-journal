"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";

type Trade = {
  id: string;
  pair: string;
  session: string;
  profit_loss: number;
  result: string;
  created_at: string;
};

export default function CalendarPage() {
  const router = useRouter();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  useEffect(() => {
    async function loadTrades() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: manualTrades } = await supabase
        .from("trades")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      const { data: mt5Data } = await supabase
        .from("mt5_trades")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      const mt5Mapped = (mt5Data || []).map((t) => ({
        id: String(t.id),
        pair: t.symbol,
        session: "MT5",
        profit_loss: t.profit,
        result: t.profit > 0 ? "Win" : t.profit < 0 ? "Loss" : "Break Even",
        created_at: t.close_time || t.open_time || t.created_at || new Date().toISOString(),
        trade_date: t.close_time || t.open_time || t.created_at,
      }));

      setTrades([...(manualTrades || []), ...mt5Mapped]);
    }
    loadTrades();
  }, []);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const profitByDay: Record<string, { profit: number; trades: Trade[] }> = {};
  trades.forEach((trade) => {
    const date = new Date((trade as any).trade_date || trade.created_at);
    if (date.getFullYear() !== year || date.getMonth() !== month) return;
    const key = date.toISOString().slice(0, 10);
    if (!profitByDay[key]) profitByDay[key] = { profit: 0, trades: [] };
    profitByDay[key].profit += Number(trade.profit_loss);
    profitByDay[key].trades.push(trade);
  });

  const selectedDayTrades = selectedDay ? (profitByDay[selectedDay]?.trades || []) : [];

  const monthName = now.toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <p className="mb-3 w-fit rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1 text-sm text-blue-300">
            Trading Calendar
          </p>
          <h1 className="text-3xl font-bold">{monthName}</h1>
          <p className="mt-2 text-sm text-white/40">Tap a day to see your trades.</p>
        </div>

        {/* Calendar grid */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          {/* Day headers */}
          <div className="mb-2 grid grid-cols-7 text-center">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div key={i} className="py-1 text-xs text-white/30">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {/* Day cells */}
            {Array.from({ length: totalDays }).map((_, i) => {
              const day = i + 1;
              const date = new Date(year, month, day).toISOString().slice(0, 10);
              const data = profitByDay[date];
              const isSelected = selectedDay === date;

              return (
                <button
                  key={date}
                  onClick={() => setSelectedDay(isSelected ? null : date)}
                  className={`flex flex-col items-center justify-start rounded-xl p-1 py-2 transition ${
                    isSelected
                      ? "ring-2 ring-blue-500 bg-blue-500/10"
                      : data
                      ? data.profit > 0
                        ? "bg-green-500/10 border border-green-500/20 hover:bg-green-500/20"
                        : "bg-red-500/10 border border-red-500/20 hover:bg-red-500/20"
                      : "bg-white/[0.02] border border-white/5"
                  }`}
                >
                  <span className="text-xs text-white/50">{day}</span>
                  {data && (
                    <span className={`text-xs font-bold mt-1 ${
                      data.profit > 0 ? "text-green-400" : "text-red-400"
                    }`}>
                      {data.profit > 0 ? "+" : ""}{data.profit.toFixed(0)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected day trades */}
        {selectedDay && (
          <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <h2 className="mb-4 text-lg font-semibold">
              {new Date(selectedDay).toLocaleDateString("en-US", {
                weekday: "long", month: "long", day: "numeric"
              })}
            </h2>

            {selectedDayTrades.length === 0 ? (
              <p className="text-white/40">No trades on this day.</p>
            ) : (
              <div className="space-y-3">
                {selectedDayTrades.map((trade) => (
                  <div key={trade.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 p-4">
                    <div>
                      <p className="font-semibold">{trade.pair}</p>
                      <p className="text-sm text-white/40">{trade.session}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${trade.profit_loss >= 0 ? "text-green-400" : "text-red-400"}`}>
                        ${trade.profit_loss}
                      </p>
                      <p className="text-sm text-white/40">{trade.result}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}