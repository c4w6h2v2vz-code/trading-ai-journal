"use client";

import { useRouter } from "next/navigation";

type Trade = {
  id: string;
  pair: string;
  session: string;
  strategy: string | null;
  direction: string | null;
  grade: string | null;
  emotion: string | null;
  mistake: string | null;
  risk_reward: number | null;
  entry_price: number;
  exit_price: number;
  profit_loss: number;
  result: string;
  notes: string;
  image_url: string | null;
ai_score: number | null;
ai_risk_score: number | null;
ai_psychology_score: number | null;
ai_execution_score: number | null;
ai_feedback: string | null;};

export default function TradeHistory({
  trades,
  onEdit,
  onDelete,
}: {
  trades: Trade[];
  onEdit: (trade: Trade) => void;
  onDelete: (id: string) => void;
}) {
  const router = useRouter();

  if (trades.length === 0) {
    return <p className="text-white/40">No trades found.</p>;
  }

  return (
    <div className="space-y-4">
      {trades.map((trade) => (
        <div
          key={trade.id}
          className="grid gap-4 rounded-3xl border border-white/10 bg-black/40 p-4 transition hover:border-white/20 lg:grid-cols-[1fr_150px_220px]"
        >
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-xl font-bold">{trade.pair}</h3>
              <Badge text={trade.direction || "N/A"} />
              <Badge text={trade.strategy || "No strategy"} />
              <Badge text={trade.grade || "No grade"} />
              <Badge text={trade.result} />
              
            </div>

            <div className="mt-4 grid gap-3 text-sm text-white/50 sm:grid-cols-3">
              <p>Session: <span className="text-white">{trade.session}</span></p>
              <p>Entry: <span className="text-white">{trade.entry_price}</span></p>
              <p>Exit: <span className="text-white">{trade.exit_price}</span></p>
              <p>
                P/L:{" "}
                <span className={trade.profit_loss >= 0 ? "text-green-400" : "text-red-400"}>
                  {trade.profit_loss}
                </span>
              </p>
              <p>R:R: <span className="text-white">{trade.risk_reward || "N/A"}</span></p>
              <p>Emotion: <span className="text-white">{trade.emotion || "N/A"}</span></p>
            </div>

            {trade.mistake && (
              <p className="mt-4 rounded-2xl bg-red-500/10 p-3 text-sm text-red-300">
                Mistake: {trade.mistake}
              </p>
            )}

            {trade.notes && (
              <p className="mt-4 rounded-2xl bg-white/[0.03] p-3 text-sm text-white/50">
                {trade.notes}
              </p>
            )}
          </div>

          <div>
            {trade.image_url ? (
              <a href={trade.image_url} target="_blank" rel="noopener noreferrer">
                <img
                  src={trade.image_url}
                  alt="Trade screenshot"
                  className="h-28 w-full rounded-2xl border border-white/10 object-cover hover:opacity-80"
                />
              </a>
            ) : (
              <div className="flex h-28 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-sm text-white/30">
                No image
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 lg:justify-end">
            <button
              onClick={() => router.push(`/journal/trade/${trade.id}`)}
              className="rounded-xl bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-400 hover:bg-blue-500/20"
            >
              View
            </button>

            <button
              onClick={() => onEdit(trade)}
              className="rounded-xl bg-yellow-500/10 px-4 py-2 text-sm font-semibold text-yellow-400 hover:bg-yellow-500/20"
            >
              Edit
            </button>

            <button
              onClick={() => onDelete(trade.id)}
              className="rounded-xl bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/20"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/60">
      {text}
    </span>
  );
}