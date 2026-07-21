"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AppShell from "@/components/AppShell";

type Trade = {
  id: string;
  pair: string;
  session: string;
  profit_loss: number;
  result: string;
  created_at: string;
  trade_date?: string | null;
};

// Build a YYYY-MM-DD key using LOCAL date (not UTC) to avoid timezone day-shift
function localKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function CalendarPage() {
  const router = useRouter();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  useEffect(() => {
    async function loadTrades() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: manualTrades } = await supabase
        .from("trades")
        .select("*")
        .eq("user_id", user.id)
        .eq("trade_source", "Live")
        .order("created_at", { ascending: true });

      const activeAccount = localStorage.getItem("active_account");
      const acctNum = activeAccount ? String(JSON.parse(activeAccount).account_number).trim() : null;

      let mt5Query = supabase.from("mt5_trades").select("*").eq("user_id", user.id);
      if (acctNum) mt5Query = mt5Query.eq("account", acctNum);
      const { data: mt5 } = await mt5Query.order("created_at", { ascending: true });

      const manualMapped: Trade[] = (manualTrades || []).map((t: any) => ({
        id: String(t.id),
        pair: t.pair,
        session: t.session || "Manual",
        profit_loss: Number(t.profit_loss),
        result: t.result,
        created_at: t.created_at,
        trade_date: t.trade_date || t.created_at,
      }));

      const mt5Mapped: Trade[] = (mt5 || []).map((t: any) => ({
        id: "mt5-" + t.id,
        pair: t.symbol,
        session: "MT5",
        profit_loss: Number(t.profit),
        result: t.profit > 0 ? "Win" : t.profit < 0 ? "Loss" : "Break Even",
        created_at: t.created_at,
        trade_date: t.close_time || t.created_at,
      }));

      setTrades([...manualMapped, ...mt5Mapped]);
      setLoading(false);
    }
    loadTrades();
  }, []);

  // Group by real local date
  const profitByDay: Record<string, { profit: number; trades: Trade[] }> = {};
  trades.forEach((trade) => {
    const raw = trade.trade_date || trade.created_at;
    const date = new Date(raw);
    if (isNaN(date.getTime())) return;
    if (date.getFullYear() !== year || date.getMonth() !== month) return;
    const key = localKey(date);
    if (!profitByDay[key]) profitByDay[key] = { profit: 0, trades: [] };
    profitByDay[key].profit += Number(trade.profit_loss);
    profitByDay[key].trades.push(trade);
  });

  const selectedDayTrades = selectedDay ? (profitByDay[selectedDay]?.trades || []) : [];

  const totalDays = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay(); // 0 = Sunday
  const monthName = new Date(year, month, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const todayKey = localKey(new Date());

  function prevMonth() {
    setSelectedDay(null);
    if (month === 0) { setMonth(11); setYear(year - 1); } else setMonth(month - 1);
  }
  function nextMonth() {
    setSelectedDay(null);
    if (month === 11) { setMonth(0); setYear(year + 1); } else setMonth(month + 1);
  }

  // Month total
  const monthTotal = Object.values(profitByDay).reduce((s, d) => s + d.profit, 0);

  if (loading) return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="h-96 animate-pulse rounded-2xl bg-white/[0.04]" />
      </div>
    </AppShell>
  );

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-blue-400">Calendar</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Trading Calendar</h1>
            <p className="mt-1 text-sm text-white/40">Tap a day to see your trades.</p>
          </div>
          <div className={`rounded-2xl border px-4 py-2 text-right ${monthTotal >= 0 ? "border-emerald-500/20 bg-emerald-500/[0.07]" : "border-red-500/20 bg-red-500/[0.07]"}`}>
            <p className="text-xs text-white/40">Month P/L</p>
            <p className={`text-lg font-semibold tabular-nums ${monthTotal >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {monthTotal >= 0 ? "+" : "-"}${Math.abs(monthTotal).toFixed(0)}
            </p>
          </div>
        </div>

        {/* Month nav */}
        <div className="mb-4 flex items-center justify-between">
          <button onClick={prevMonth} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm hover:bg-white/[0.06]">← Prev</button>
          <h2 className="text-lg font-semibold">{monthName}</h2>
          <button onClick={nextMonth} className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm hover:bg-white/[0.06]">Next →</button>
        </div>

        {/* Weekday headers */}
        <div className="mb-2 grid grid-cols-7 gap-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-center text-xs font-medium text-white/30">{d}</div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: firstWeekday }).map((_, i) => (
            <div key={"empty-" + i} />
          ))}
          {Array.from({ length: totalDays }).map((_, i) => {
            const day = i + 1;
            const key = localKey(new Date(year, month, day));
            const dayData = profitByDay[key];
            const hasTrades = !!dayData;
            const profit = dayData?.profit || 0;
            const isSelected = selectedDay === key;
            const isToday = key === todayKey;

            return (
              <button
                key={key}
                onClick={() => setSelectedDay(isSelected ? null : key)}
                className={`flex aspect-square flex-col items-center justify-center rounded-xl border p-1 transition ${
                  isSelected ? "border-blue-500 bg-blue-500/10" :
                  hasTrades
                    ? profit >= 0 ? "border-emerald-500/20 bg-emerald-500/[0.06]" : "border-red-500/20 bg-red-500/[0.06]"
                    : "border-white/[0.06] bg-white/[0.02]"
                } ${isToday ? "ring-1 ring-blue-400" : ""}`}
              >
                <span className={`text-sm font-medium ${isToday ? "text-blue-400" : "text-white/70"}`}>{day}</span>
                {hasTrades && (
                  <span className={`text-[10px] font-semibold tabular-nums ${profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {profit >= 0 ? "+" : ""}{profit.toFixed(0)}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected day trades */}
        {selectedDay && (
          <div className="mt-6">
            <h3 className="mb-3 text-sm font-semibold text-white/80">
              {new Date(selectedDay + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </h3>
            {selectedDayTrades.length === 0 ? (
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 text-center text-sm text-white/40">
                No trades on this day.
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                {selectedDayTrades.map((trade, i) => (
                  <div key={trade.id} className={`flex items-center justify-between px-4 py-3 ${i !== selectedDayTrades.length - 1 ? "border-b border-white/[0.04]" : ""}`}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] text-xs font-semibold text-white/60">
                        {trade.pair?.slice(0, 3) || "—"}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{trade.pair}</p>
                        <p className="text-xs text-white/30">{trade.session === "MT5" ? "Synced" : trade.session}</p>
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
        )}
      </div>
    </AppShell>
  );
}