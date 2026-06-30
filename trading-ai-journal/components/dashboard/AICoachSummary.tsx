type Trade = {
  profit_loss: number;
  result: string;
  session: string;
  strategy?: string | null;
  emotion?: string | null;
  grade?: string | null;
  risk_reward?: number | null;
};

export default function AICoachSummary({ trades }: { trades: Trade[] }) {
  const totalTrades = trades.length;
  const losingTrades = trades.filter((trade) => trade.result === "Loss");
  const fomoTrades = trades.filter((trade) => trade.emotion === "FOMO");
  const revengeTrades = trades.filter((trade) => trade.emotion === "Revenge");

  const averageRR =
    totalTrades > 0
      ? trades.reduce((sum, trade) => sum + Number(trade.risk_reward || 0), 0) /
        totalTrades
      : 0;

  const bestSession = getBestGroup(trades, "session");
  const bestStrategy = getBestGroup(trades, "strategy");

  let mainAdvice = "Add more trades so your coach can find stronger patterns.";

  if (totalTrades >= 3) {
    if (fomoTrades.length > 0 || revengeTrades.length > 0) {
      mainAdvice =
        "Your emotions are affecting some trades. Watch FOMO and revenge trading carefully.";
    } else if (averageRR > 0 && averageRR < 1.5) {
      mainAdvice =
        "Your average risk/reward is low. Try to focus on cleaner setups with better reward potential.";
    } else if (losingTrades.length > totalTrades / 2) {
      mainAdvice =
        "You have more losses than wins. Review your entries and wait for stronger confirmation.";
    } else {
      mainAdvice =
        "Your trading data looks healthy so far. Keep journaling every trade and protect your discipline.";
    }
  }

  return (
    <div className="mb-8 rounded-3xl border border-blue-500/20 bg-blue-500/10 p-6 shadow-2xl shadow-black/40">
      <p className="mb-3 w-fit rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1 text-sm text-blue-300">
        AI Coach
      </p>

      <h2 className="text-2xl font-semibold text-blue-200">
        Trading Coach Summary
      </h2>

      <p className="mt-4 text-white/70">{mainAdvice}</p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <CoachCard title="Best Session" value={bestSession} />
        <CoachCard title="Best Strategy" value={bestStrategy} />
        <CoachCard title="Avg R:R" value={averageRR.toFixed(2)} />
      </div>
    </div>
  );
}

function getBestGroup(
  trades: Trade[],
  key: "session" | "strategy"
) {
  const groups: Record<string, number> = {};

  trades.forEach((trade) => {
    const groupName = trade[key] || "Unknown";
    groups[groupName] = (groups[groupName] || 0) + Number(trade.profit_loss);
  });

  const sorted = Object.entries(groups).sort((a, b) => b[1] - a[1]);

  return sorted.length > 0 ? `${sorted[0][0]} (${sorted[0][1]})` : "No data";
}

function CoachCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
      <p className="text-sm text-white/40">{title}</p>
      <p className="mt-2 font-semibold text-white">{value}</p>
    </div>
  );
}