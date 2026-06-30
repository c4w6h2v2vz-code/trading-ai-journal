type Trade = {
  profit_loss: number;
  result: string;
  risk_reward?: number | null;
};

export default function AnalyticsCards({ trades }: { trades: Trade[] }) {
  const wins = trades.filter((trade) => trade.result === "Win");
  const losses = trades.filter((trade) => trade.result === "Loss");

  const grossProfit = wins.reduce(
    (sum, trade) => sum + Number(trade.profit_loss),
    0
  );

  const grossLoss = Math.abs(
    losses.reduce((sum, trade) => sum + Number(trade.profit_loss), 0)
  );

  const profitFactor =
    grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : "0";

  const expectancy =
    trades.length > 0
      ? (
          trades.reduce((sum, trade) => sum + Number(trade.profit_loss), 0) /
          trades.length
        ).toFixed(2)
      : "0";

  const averageRR =
    trades.length > 0
      ? (
          trades.reduce((sum, trade) => sum + Number(trade.risk_reward || 0), 0) /
          trades.length
        ).toFixed(2)
      : "0";

  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card title="Profit Factor" value={profitFactor} />
      <Card title="Expectancy" value={expectancy} />
      <Card title="Average R:R" value={averageRR} />
    </div>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/30">
      <p className="text-sm text-white/40">{title}</p>
      <h2 className="mt-3 text-3xl font-bold text-blue-400">{value}</h2>
    </div>
  );
}