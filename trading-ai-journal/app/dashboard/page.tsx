"use client";

import PerformanceBreakdown from "@/components/dashboard/PerformanceBreakdown";
import AICoachSummary from "@/components/dashboard/AICoachSummary";
import AnalyticsCards from "@/components/dashboard/AnalyticsCards";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { supabase } from "@/lib/supabase";
import AppShell from "@/components/AppShell";

type Trade = {
  id: string;
  user_id: string;
  pair: string;
  session: string;
  entry_price: number;
  exit_price: number;
  profit_loss: number;
  result: string;
  notes: string;
  created_at: string;
  ai_score: number | null;
  ai_risk_score: number | null;
  ai_psychology_score: number | null;
  ai_execution_score: number | null;
  ai_feedback: string | null;
};

export default function DashboardPage() {
  const router = useRouter();
  const [trades, setTrades] = useState<Trade[]>([]);

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
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      setTrades(data || []);
    }

    loadTrades();
  }, [router]);

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
  const equityData = trades.map((trade, index) => {
    runningProfit += Number(trade.profit_loss);

    return {
      name: `Trade ${index + 1}`,
      equity: runningProfit,
      profit: Number(trade.profit_loss),
    };
  });

  const dailyData = getDailyData(trades);

  const winLossData = [
    { name: "Wins", value: wins.length },
    { name: "Losses", value: losses.length },
  ];

  const recentTrades = [...trades].reverse().slice(0, 6);

  const averageAiScore = getAverageScore(trades, "ai_score");
  const averageRiskScore = getAverageScore(trades, "ai_risk_score");
  const averagePsychologyScore = getAverageScore(
    trades,
    "ai_psychology_score"
  );
  const averageExecutionScore = getAverageScore(trades, "ai_execution_score");

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 w-fit rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1 text-sm text-blue-300">
              Private Trading Analytics
            </p>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              Performance Dashboard
            </h1>
            <p className="mt-3 text-white/50">
              Professional charts for your private trading performance.
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

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Average AI Score" value={averageAiScore} highlight="blue" />
          <StatCard title="Average Risk Score" value={averageRiskScore} />
          <StatCard title="Average Psychology Score" value={averagePsychologyScore} />
          <StatCard title="Average Execution Score" value={averageExecutionScore} />
        </div>

        <div className="mb-8 grid gap-4 lg:grid-cols-3">
          <InfoCard title="Best Pair" value={bestPair} />
          <AnalyticsCards trades={trades} />
          <AICoachSummary trades={trades} />
          <PerformanceBreakdown trades={trades} />
          <InfoCard title="Best Session" value={bestSession} />
          <InfoCard
            title="AI Coach Note"
            value={
              totalTrades === 0
                ? "Add trades to unlock private insights."
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

          {equityData.length === 0 ? (
            <p className="text-white/40">No data yet.</p>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={equityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
                  <XAxis dataKey="name" stroke="#ffffff60" />
                  <YAxis stroke="#ffffff60" />
                  <Tooltip
                    contentStyle={{
                      background: "#111",
                      border: "1px solid #ffffff20",
                      borderRadius: "12px",
                      color: "#fff",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="equity"
                    stroke="#22c55e"
                    fill="#22c55e33"
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="mb-8 grid gap-4 lg:grid-cols-2">
          <ChartCard title="Daily Profit / Loss">
            {dailyData.length === 0 ? (
              <p className="text-white/40">No data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
                  <XAxis dataKey="date" stroke="#ffffff60" />
                  <YAxis stroke="#ffffff60" />
                  <Tooltip
                    contentStyle={{
                      background: "#111",
                      border: "1px solid #ffffff20",
                      borderRadius: "12px",
                      color: "#fff",
                    }}
                  />
                  <Bar dataKey="profit" radius={[8, 8, 0, 0]}>
                    {dailyData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={entry.profit >= 0 ? "#22c55e" : "#ef4444"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Win vs Loss">
            {totalTrades === 0 ? (
              <p className="text-white/40">No data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={winLossData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={100}
                    label
                  >
                    <Cell fill="#22c55e" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#111",
                      border: "1px solid #ffffff20",
                      borderRadius: "12px",
                      color: "#fff",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
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

function getDailyData(trades: Trade[]) {
  const days: Record<string, number> = {};

  trades.forEach((trade) => {
    const date = new Date(trade.created_at).toLocaleDateString();
    days[date] = (days[date] || 0) + Number(trade.profit_loss);
  });

  return Object.entries(days).map(([date, profit]) => ({
    date,
    profit,
  }));
}

function getAverageScore(
  trades: Trade[],
  key:
    | "ai_score"
    | "ai_risk_score"
    | "ai_psychology_score"
    | "ai_execution_score"
) {
  const scores = trades
    .map((trade) => trade[key])
    .filter((score): score is number => score !== null && score !== undefined);

  if (scores.length === 0) return "0";

  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;

  return average.toFixed(1);
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

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/40">
      <h2 className="mb-6 text-2xl font-semibold">{title}</h2>
      {children}
    </div>
  );
}