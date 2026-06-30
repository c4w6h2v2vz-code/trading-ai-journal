"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AppShell from "@/components/AppShell";

type Trade = {
  id: string;
  user_id: string;
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
  created_at: string;
};

export default function TradeDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const tradeId = params.id as string;

  const [trade, setTrade] = useState<Trade | null>(null);
  const [message, setMessage] = useState("Loading trade...");

  useEffect(() => {
    async function loadTrade() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .eq("id", tradeId)
        .eq("user_id", user.id)
        .single();

      if (error) {
        setMessage("Trade not found or you do not have access.");
        return;
      }

      setTrade(data);
      setMessage("");
    }

    loadTrade();
  }, [router, tradeId]);

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-6 py-8">
        <button
          onClick={() => router.push("/journal")}
          className="mb-6 rounded-2xl bg-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/20"
        >
          ← Back to Journal
        </button>

        {!trade ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-white/50">
            {message}
          </div>
        ) : (
          <>
            <div className="mb-8">
              <p className="mb-3 w-fit rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1 text-sm text-blue-300">
                Trade Details
              </p>

              <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                {trade.pair}
              </h1>

              <p className="mt-3 text-white/50">
                Full breakdown of this trade.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/40">
                <h2 className="mb-4 text-2xl font-semibold">Chart Screenshot</h2>

                {trade.image_url ? (
                  <a href={trade.image_url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={trade.image_url}
                      alt="Trade screenshot"
                      className="w-full rounded-3xl border border-white/10 object-cover"
                    />
                  </a>
                ) : (
                  <div className="flex h-80 items-center justify-center rounded-3xl border border-white/10 bg-black/40 text-white/30">
                    No screenshot uploaded
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/40">
                <h2 className="mb-6 text-2xl font-semibold">Trade Summary</h2>

                <div className="space-y-4">
                  <Detail label="Direction" value={trade.direction || "N/A"} />
                  <Detail label="Result" value={trade.result} />
                  <Detail label="Session" value={trade.session} />
                  <Detail label="Strategy" value={trade.strategy || "N/A"} />
                  <Detail label="Grade" value={trade.grade || "N/A"} />
                  <Detail label="Emotion" value={trade.emotion || "N/A"} />
                  <Detail label="Risk Reward" value={String(trade.risk_reward || "N/A")} />
                  <Detail label="Entry" value={String(trade.entry_price)} />
                  <Detail label="Exit" value={String(trade.exit_price)} />
                  <Detail
                    label="Profit / Loss"
                    value={String(trade.profit_loss)}
                    positive={trade.profit_loss >= 0}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/40">
                <h2 className="mb-4 text-2xl font-semibold">Mistake</h2>
                <p className="rounded-2xl bg-red-500/10 p-4 text-red-300">
                  {trade.mistake || "No mistake recorded."}
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/40">
                <h2 className="mb-4 text-2xl font-semibold">Notes</h2>
                <p className="rounded-2xl bg-black/40 p-4 text-white/60">
                  {trade.notes || "No notes recorded."}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-blue-500/20 bg-blue-500/10 p-6 shadow-2xl shadow-black/40">
              <h2 className="mb-3 text-2xl font-semibold text-blue-300">
                AI Coach Placeholder
              </h2>
              <p className="text-white/60">
                Soon this section will analyze your trade, find mistakes, and give you improvement advice.
              </p>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

function Detail({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 p-4">
      <p className="text-sm text-white/40">{label}</p>
      <p
        className={`font-semibold ${
          positive === undefined
            ? "text-white"
            : positive
            ? "text-green-400"
            : "text-red-400"
        }`}
      >
        {value}
      </p>
    </div>
  );
}