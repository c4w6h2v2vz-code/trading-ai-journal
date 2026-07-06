"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";

type Trade = {
  profit_loss: number;
  result: string;
  created_at: string;
};

export default function GoalsPage() {
  const router = useRouter();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  const [dailyGoal, setDailyGoal] = useState(100);
  const [weeklyGoal, setWeeklyGoal] = useState(500);
  const [monthlyGoal, setMonthlyGoal] = useState(2000);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("trading-goals");
    if (saved) {
      const goals = JSON.parse(saved);
      setDailyGoal(goals.daily || 100);
      setWeeklyGoal(goals.weekly || 500);
      setMonthlyGoal(goals.monthly || 2000);
    }

    async function loadTrades() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: manualTrades } = await supabase
        .from("trades")
        .select("profit_loss, result, created_at")
        .eq("user_id", user.id);

      const { data: mt5Data } = await supabase
        .from("mt5_trades")
        .select("profit, open_time")
        .eq("user_id", user.id);

      const mt5Mapped = (mt5Data || []).map((t) => ({
        profit_loss: t.profit,
        result: t.profit > 0 ? "Win" : t.profit < 0 ? "Loss" : "Break Even",
        created_at: t.open_time || new Date().toISOString(),
      }));

      setTrades([...(manualTrades || []), ...mt5Mapped]);
      setLoading(false);
      setLoading(false);
    }

    loadTrades();
  }, []);

  function saveGoals() {
    localStorage.setItem("trading-goals", JSON.stringify({
      daily: dailyGoal,
      weekly: weeklyGoal,
      monthly: monthlyGoal,
    }));
    setEditing(false);
  }

  const now = new Date();

  const todayProfit = trades
    .filter(t => new Date(t.created_at).toDateString() === now.toDateString())
    .reduce((sum, t) => sum + Number(t.profit_loss), 0);

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const weekProfit = trades
    .filter(t => new Date(t.created_at) >= startOfWeek)
    .reduce((sum, t) => sum + Number(t.profit_loss), 0);

  const monthProfit = trades
    .filter(t => {
      const d = new Date(t.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, t) => sum + Number(t.profit_loss), 0);

  const todayTrades = trades.filter(t => new Date(t.created_at).toDateString() === now.toDateString());
  const todayWins = todayTrades.filter(t => t.result === "Win").length;
  const weekTrades = trades.filter(t => new Date(t.created_at) >= startOfWeek);
  const weekWins = weekTrades.filter(t => t.result === "Win").length;
  const monthTrades = trades.filter(t => {
    const d = new Date(t.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthWins = monthTrades.filter(t => t.result === "Win").length;

  if (loading) return (
    <AppShell>
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-white/40">Loading goals...</p>
      </div>
    </AppShell>
  );

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-10">
          <p className="mb-3 w-fit rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1 text-sm text-green-300">
            Trading Goals
          </p>
          <h1 className="text-4xl font-bold tracking-tight">Goals & Progress</h1>
          <p className="mt-3 text-white/50">Track your daily, weekly, and monthly trading targets.</p>
        </div>

        {/* Edit Goals */}
        <div className="mb-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Your Goals</h2>
            <button
              onClick={() => editing ? saveGoals() : setEditing(true)}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                editing
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-white/10 hover:bg-white/20"
              }`}
            >
              {editing ? "Save Goals" : "Edit Goals"}
            </button>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <GoalInput label="Daily Goal ($)" value={dailyGoal} onChange={setDailyGoal} editing={editing} />
            <GoalInput label="Weekly Goal ($)" value={weeklyGoal} onChange={setWeeklyGoal} editing={editing} />
            <GoalInput label="Monthly Goal ($)" value={monthlyGoal} onChange={setMonthlyGoal} editing={editing} />
          </div>
        </div>

        {/* Progress Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <GoalCard
            title="Today"
            current={todayProfit}
            goal={dailyGoal}
            trades={todayTrades.length}
            wins={todayWins}
          />
          <GoalCard
            title="This Week"
            current={weekProfit}
            goal={weeklyGoal}
            trades={weekTrades.length}
            wins={weekWins}
          />
          <GoalCard
            title="This Month"
            current={monthProfit}
            goal={monthlyGoal}
            trades={monthTrades.length}
            wins={monthWins}
          />
        </div>

        {/* AI Status */}
        <div className="rounded-3xl border border-green-500/20 bg-green-500/5 p-6">
          <h2 className="mb-4 text-xl font-semibold">AI Goal Analysis</h2>
          <div className="space-y-3">
            <AIStatus label="Daily" current={todayProfit} goal={dailyGoal} period="today" />
            <AIStatus label="Weekly" current={weekProfit} goal={weeklyGoal} period="this week" />
            <AIStatus label="Monthly" current={monthProfit} goal={monthlyGoal} period="this month" />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function GoalInput({ label, value, onChange, editing }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  editing: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <p className="text-sm text-white/40">{label}</p>
      {editing ? (
        <input
          type="number"
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="mt-2 w-full rounded-xl bg-white/10 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-green-500"
        />
      ) : (
        <p className="mt-2 text-2xl font-bold text-green-400">${value}</p>
      )}
    </div>
  );
}

function GoalCard({ title, current, goal, trades, wins }: {
  title: string;
  current: number;
  goal: number;
  trades: number;
  wins: number;
}) {
  const progress = Math.min((current / goal) * 100, 100);
  const achieved = current >= goal;

  return (
    <div className={`rounded-3xl border p-6 ${
      achieved
        ? "border-green-500/30 bg-green-500/5"
        : "border-white/10 bg-white/[0.04]"
    }`}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/40">{title}</p>
        {achieved && <span className="text-green-400 text-lg">🎯</span>}
      </div>

      <p className={`mt-2 text-2xl font-bold ${current >= 0 ? "text-green-400" : "text-red-400"}`}>
        ${current.toFixed(2)}
      </p>
      <p className="text-sm text-white/40">Goal: ${goal}</p>

      <div className="mt-4 h-2 rounded-full bg-white/10">
        <div
          className={`h-2 rounded-full transition-all ${achieved ? "bg-green-500" : "bg-blue-500"}`}
          style={{ width: `${Math.max(progress, 0)}%` }}
        />
      </div>

      <p className="mt-2 text-xs text-white/40">{progress.toFixed(0)}% of goal</p>

      <div className="mt-3 flex gap-3 text-xs text-white/40">
        <span>{trades} trades</span>
        <span>{trades > 0 ? ((wins / trades) * 100).toFixed(0) : 0}% WR</span>
      </div>
    </div>
  );
}

function AIStatus({ label, current, goal, period }: {
  label: string;
  current: number;
  goal: number;
  period: string;
}) {
  const percent = (current / goal) * 100;
  let message = "";
  let color = "";

  if (current >= goal) {
    message = `🎯 ${label} goal achieved! You're ${percent.toFixed(0)}% of target. Excellent discipline.`;
    color = "text-green-400";
  } else if (percent >= 50) {
    message = `📈 ${label} goal is ${percent.toFixed(0)}% complete. Keep pushing — you can hit $${goal} ${period}.`;
    color = "text-blue-400";
  } else if (current > 0) {
    message = `⚠️ ${label} goal is only ${percent.toFixed(0)}% complete. Focus on quality setups to reach $${goal} ${period}.`;
    color = "text-yellow-400";
  } else {
    message = `📊 No profit recorded ${period} yet. Start trading to track your ${label.toLowerCase()} goal of $${goal}.`;
    color = "text-white/40";
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className={`text-sm font-medium ${color}`}>{message}</p>
    </div>
  );
}