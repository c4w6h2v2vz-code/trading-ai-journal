"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Trade = {
  profit_loss: number;
  session: string;
  strategy?: string | null;
};

export default function PerformanceBreakdown({ trades }: { trades: Trade[] }) {
  const sessionData = getGroupData(trades, "session");
  const strategyData = getGroupData(trades, "strategy");

  return (
    <div className="mb-8 grid gap-4 lg:grid-cols-2">
      <ChartCard title="Session Performance" data={sessionData} />
      <ChartCard title="Strategy Performance" data={strategyData} />
    </div>
  );
}

function getGroupData(trades: Trade[], key: "session" | "strategy") {
  const groups: Record<string, number> = {};

  trades.forEach((trade) => {
    const name = trade[key] || "Unknown";
    groups[name] = (groups[name] || 0) + Number(trade.profit_loss);
  });

  return Object.entries(groups).map(([name, profit]) => ({
    name,
    profit,
  }));
}

function ChartCard({
  title,
  data,
}: {
  title: string;
  data: { name: string; profit: number }[];
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/40">
      <h2 className="mb-6 text-2xl font-semibold">{title}</h2>

      {data.length === 0 ? (
        <p className="text-white/40">No data yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
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
            <Bar dataKey="profit" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.profit >= 0 ? "#22c55e" : "#ef4444"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}