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
        created_at: t.open_time || new Date().toISOString(),
      }));

      setTrades([...(manualTrades || []), ...mt5Mapped]);
    }
    loadTrades();
  }, []);

  const days = buildCalendarDays(trades);

  const selectedDayTrades = selectedDay
    ? trades.filter(t => new Date(t.created_at).toISOString().slice(0, 10) === selectedDay)
    : [];

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-10">
          <p className="mb-3 w-fit rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1 text-sm text-blue-300">
            Trading Calendar
          </p>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Monthly Performance</h1>
          <p className="mt-3 text-white/50">Green days are profitable, red days are losing days. Click a day to see trades.</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/40">
          <div className="grid grid-cols-7 gap-3 text-center text-sm text-white/40">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-7 gap-3">
            {days.map((day, index) => (
              <div
                key={index}
                onClick={() => day.date && day.trades > 0 ? setSelectedDay(day.date === selectedDay ? null : day.date) : null}
                className={`min-h-28 rounded-2xl border p-3 transition ${
                  day.date === ""
                    ? "border-transparent"
                    : day.profit > 0
                    ? "border-green-500/20 bg-green-500/10 cursor-pointer hover:border-green-500/40"
                    : day.profit < 0
                    ? "border-red-500/20 bg-red-500/10 cursor-pointer hover:border-red-500/40"
                    : "border-white/10 bg-black/40"
                } ${day.date === selectedDay ? "ring-2 ring-blue-500" : ""}`}
              >
                {day.date && (
                  <>
                    <p className="text-sm text-white/50">{day.dayNumber}</p>
                    <p className={`mt-3 text-xl font-bold ${
                      day.profit > 0 ? "text-green-400" : day.profit < 0 ? "text-red-400" : "text-white/40"
                    }`}>
                      {day.profit !== 0 ? day.profit.toFixed(2) : "0"}
                    </p>
                    <p className="mt-1 text-xs text-white/40">{day.trades} trades</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Selected day trades */}
        {selectedDay && selectedDayTrades.length > 0 && (
          <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <h2 className="mb-4 text-xl font-semibold">
              Trades on {new Date(selectedDay).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </h2>
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
          </div>
        )}
      </div>
    </AppShell>
  );
}

function buildCalendarDays(trades: Trade[]) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPadding = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const profitByDay: Record<string, { profit: number; trades: number }> = {};

  trades.forEach((trade) => {
    const date = new Date(trade.created_at);
    if (date.getFullYear() !== year || date.getMonth() !== month) return;
    const key = date.toISOString().slice(0, 10);
    if (!profitByDay[key]) profitByDay[key] = { profit: 0, trades: 0 };
    profitByDay[key].profit += Number(trade.profit_loss);
    profitByDay[key].trades += 1;
  });

  const days = [];

  for (let i = 0; i < startPadding; i++) {
    days.push({ date: "", dayNumber: "", profit: 0, trades: 0 });
  }

  for (let day = 1; day <= totalDays; day++) {
    const date = new Date(year, month, day);
    const key = date.toISOString().slice(0, 10);
    const data = profitByDay[key] || { profit: 0, trades: 0 };
    days.push({ date: key, dayNumber: day, profit: data.profit, trades: data.trades });
  }

  return days;
}