"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";

type Trade = {
  profit_loss: number;
  created_at: string;
};

export default function GoalsPage() {
  const router = useRouter();
  const [trades, setTrades] = useState<Trade[]>([]);

  const dailyGoal = 100;
  const weeklyGoal = 500;
  const monthlyGoal = 2000;

  useEffect(() => {
    async function loadTrades() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("trades")
        .select("profit_loss, created_at")
        .eq("user_id", user.id);

      setTrades(data || []);
    }

    loadTrades();
  }, [router]);

  const todayProfit = getTodayProfit(trades);
  const weekProfit = getWeekProfit(trades);
  const monthProfit = getMonthProfit(trades);

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-6 py-8">
        <p className="mb-3 w-fit rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1 text-sm text-green-300">
          Trading Goals
        </p>

        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          Goals & Progress
        </h1>

        <p className="mt-3 text-white/50">
          Track your daily, weekly, and monthly trading targets.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <GoalCard title="Daily Goal" current={todayProfit} goal={dailyGoal} />
          <GoalCard title="Weekly Goal" current={weekProfit} goal={weeklyGoal} />
          <GoalCard title="Monthly Goal" current={monthProfit} goal={monthlyGoal} />
        </div>
      </div>
    </AppShell>
  );
}

function getTodayProfit(trades: Trade[]) {
  const today = new Date().toDateString();

  return trades
    .filter((trade) => new Date(trade.created_at).toDateString() === today)
    .reduce((sum, trade) => sum + Number(trade.profit_loss), 0);
}

function getWeekProfit(trades: Trade[]) {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());

  return trades
    .filter((trade) => new Date(trade.created_at) >= startOfWeek)
    .reduce((sum, trade) => sum + Number(trade.profit_loss), 0);
}

function getMonthProfit(trades: Trade[]) {
  const now = new Date();

  return trades
    .filter((trade) => {
      const date = new Date(trade.created_at);
      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, trade) => sum + Number(trade.profit_loss), 0);
}

function GoalCard({
  title,
  current,
  goal,
}: {
  title: string;
  current: number;
  goal: number;
}) {
  const progress = Math.min((current / goal) * 100, 100);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/40">
      <p className="text-sm text-white/40">{title}</p>

      <h2 className="mt-3 text-3xl font-bold text-green-400">
        {current.toFixed(2)} / {goal}
      </h2>

      <div className="mt-5 h-3 rounded-full bg-white/10">
        <div
          className="h-3 rounded-full bg-green-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="mt-3 text-sm text-white/40">
        {progress.toFixed(1)}% completed
      </p>
    </div>
  );
}