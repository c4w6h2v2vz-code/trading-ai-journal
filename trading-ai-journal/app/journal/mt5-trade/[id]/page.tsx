"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AppShell from "@/components/AppShell";

type MT5Trade = {
  id: number;
  ticket: number;
  account: string;
  server: string;
  symbol: string;
  trade_type: string;
  lot_size: number;
  entry_price: number;
  exit_price: number;
  profit: number;
  open_time: string;
  close_time: string;
  ai_score: number | null;
  ai_risk_score: number | null;
  ai_psychology_score: number | null;
  ai_execution_score: number | null;
  ai_feedback: string | null;
  reviewed_at: string | null;
};

export default function MT5TradeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [trade, setTrade] = useState<MT5Trade | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTrade() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("mt5_trades")
        .select("*")
        .eq("id", params.id)
        .eq("user_id", user.id)
        .single();

      if (error || !data) {
        router.push("/journal");
        return;
      }

      setTrade(data);
      setLoading(false);
    }

    loadTrade();
  }, [params.id]);

  if (loading) {
    return (
      <AppShell>
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-white/40">Loading trade...</p>
        </div>
      </AppShell>
    );
  }

  if (!trade) return null;

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-6 py-8">
        <button
          onClick={() => router.push("/journal")}
          className="mb-6 text-sm text-white/40 hover:text-white"
        >
          ← Back to Journal
        </button>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <h1 className="text-4xl font-bold">{trade.symbol}</h1>
          <Badge text={trade.trade_type} />
          <Badge text={`Ticket ${trade.ticket}`} />
          <Badge text={`Lot ${trade.lot_size}`} />
        </div>

        {/* AI Scores */}
        {trade.ai_score !== null && (
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ScoreCard label="AI Score" value={trade.ai_score} color="blue" />
            <ScoreCard label="Execution" value={trade.ai_execution_score} color="green" />
            <ScoreCard label="Risk" value={trade.ai_risk_score} color="yellow" />
            <ScoreCard label="Psychology" value={trade.ai_psychology_score} color="purple" />
          </div>
        )}

        {/* AI Feedback */}
        {trade.ai_feedback && (
          <div className="mb-6 rounded-3xl border border-blue-500/20 bg-blue-500/10 p-6">
            <p className="mb-2 text-sm font-semibold text-blue-400">AI Coach Feedback</p>
            <p className="text-white/80">{trade.ai_feedback}</p>
          </div>
        )}

        {/* Trade Details */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="mb-4 text-xl font-semibold">Trade Details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Detail label="Symbol" value={trade.symbol} />
            <Detail label="Type" value={trade.trade_type} />
            <Detail label="Lot Size" value={String(trade.lot_size)} />
            <Detail label="Entry Price" value={String(trade.entry_price)} />
            <Detail label="Exit Price" value={String(trade.exit_price)} />
            <Detail
              label="Profit / Loss"
              value={String(trade.profit)}
              color={trade.profit >= 0 ? "text-green-400" : "text-red-400"}
            />
            <Detail label="Account" value={trade.account} />
            <Detail label="Server" value={trade.server} />
            <Detail label="Opened" value={trade.open_time || "N/A"} />
            <Detail label="Closed" value={trade.close_time || "N/A"} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function ScoreCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number | null;
  color: string;
}) {
  const colors: Record<string, string> = {
    blue: "text-blue-400 border-blue-500/20 bg-blue-500/10",
    green: "text-green-400 border-green-500/20 bg-green-500/10",
    yellow: "text-yellow-400 border-yellow-500/20 bg-yellow-500/10",
    purple: "text-purple-400 border-purple-500/20 bg-purple-500/10",
  };

  return (
    <div className={`rounded-3xl border p-4 ${colors[color]}`}>
      <p className="text-sm opacity-70">{label}</p>
      <p className="text-3xl font-bold">{value ?? "N/A"}</p>
    </div>
  );
}

function Detail({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <p className="text-sm text-white/40">{label}</p>
      <p className={`mt-1 font-semibold ${color || "text-white"}`}>{value}</p>
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