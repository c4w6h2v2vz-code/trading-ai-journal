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
  ai_score: number | null;
  ai_risk_score: number | null;
  ai_psychology_score: number | null;
  ai_execution_score: number | null;
  ai_feedback: string | null;
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

      const riskScore = calculateRiskScore(data);
      const psychologyScore = calculatePsychologyScore(data);
      const executionScore = calculateExecutionScore(data);
      const totalScore = Math.round(
        (riskScore + psychologyScore + executionScore) / 3
      );
      const feedback = getCoachFeedback(data, totalScore);

      await supabase
        .from("trades")
        .update({
          ai_score: totalScore,
          ai_risk_score: riskScore,
          ai_psychology_score: psychologyScore,
          ai_execution_score: executionScore,
          ai_feedback: feedback,
        })
        .eq("id", data.id)
        .eq("user_id", user.id);

      setTrade({
        ...data,
        ai_score: totalScore,
        ai_risk_score: riskScore,
        ai_psychology_score: psychologyScore,
        ai_execution_score: executionScore,
        ai_feedback: feedback,
      });

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
                Full breakdown and saved AI-style review of this trade.
              </p>
            </div>

            <AICoachReview trade={trade} />

            <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/40">
                <h2 className="mb-4 text-2xl font-semibold">
                  Chart Screenshot
                </h2>

                {trade.image_url ? (
                  <a
                    href={trade.image_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
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
                  <Detail
                    label="Risk Reward"
                    value={String(trade.risk_reward || "N/A")}
                  />
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
          </>
        )}
      </div>
    </AppShell>
  );
}

function AICoachReview({ trade }: { trade: Trade }) {
  const totalScore = trade.ai_score || 0;
  const riskScore = trade.ai_risk_score || 0;
  const psychologyScore = trade.ai_psychology_score || 0;
  const executionScore = trade.ai_execution_score || 0;
  const feedback = trade.ai_feedback || "No AI feedback saved yet.";

  return (
    <div className="mb-6 rounded-3xl border border-blue-500/20 bg-blue-500/10 p-6 shadow-2xl shadow-black/40">
      <p className="mb-3 w-fit rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1 text-sm text-blue-300">
        Saved AI Coach Review
      </p>

      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <div className="rounded-3xl border border-white/10 bg-black/40 p-6 text-center">
          <p className="text-sm text-white/40">Trade Score</p>
          <p
            className={`mt-3 text-6xl font-bold ${
              totalScore >= 75
                ? "text-green-400"
                : totalScore >= 50
                ? "text-yellow-400"
                : "text-red-400"
            }`}
          >
            {totalScore}
          </p>
          <p className="mt-2 text-sm text-white/40">out of 100</p>
        </div>

        <div>
          <div className="grid gap-3 md:grid-cols-3">
            <ScoreCard title="Risk" score={riskScore} />
            <ScoreCard title="Psychology" score={psychologyScore} />
            <ScoreCard title="Execution" score={executionScore} />
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-4">
            <p className="text-sm text-white/40">Coach Feedback</p>
            <p className="mt-2 text-white/70">{feedback}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function calculateRiskScore(trade: Trade) {
  let score = 60;

  if (Number(trade.risk_reward || 0) >= 2) score += 25;
  else if (Number(trade.risk_reward || 0) >= 1.5) score += 15;
  else if (Number(trade.risk_reward || 0) > 0) score += 5;

  if (trade.profit_loss >= 0) score += 10;

  return Math.min(score, 100);
}

function calculatePsychologyScore(trade: Trade) {
  let score = 80;

  if (trade.emotion === "FOMO") score -= 30;
  if (trade.emotion === "Revenge") score -= 35;
  if (trade.emotion === "Fear") score -= 20;
  if (trade.emotion === "Greed") score -= 20;
  if (trade.emotion === "Calm") score += 10;
  if (trade.emotion === "Confident") score += 5;

  return Math.max(Math.min(score, 100), 0);
}

function calculateExecutionScore(trade: Trade) {
  let score = 70;

  if (trade.grade === "A+") score += 25;
  if (trade.grade === "A") score += 15;
  if (trade.grade === "B") score += 5;
  if (trade.grade === "C") score -= 10;
  if (trade.grade === "D") score -= 25;

  if (trade.mistake && trade.mistake.trim().length > 0) score -= 15;
  if (trade.result === "Win") score += 5;

  return Math.max(Math.min(score, 100), 0);
}

function getCoachFeedback(trade: Trade, score: number) {
  if (trade.emotion === "FOMO") {
    return "This trade shows FOMO risk. Before entering, wait for confirmation and avoid chasing price.";
  }

  if (trade.emotion === "Revenge") {
    return "This trade may be affected by revenge trading. After a loss, take a break before the next setup.";
  }

  if (trade.mistake) {
    return `Main improvement: fix this repeated mistake — ${trade.mistake}. Write a rule to prevent it next time.`;
  }

  if (Number(trade.risk_reward || 0) < 1.5) {
    return "Your risk/reward is low. Try to wait for trades where the reward is at least 1.5R to 2R.";
  }

  if (score >= 80) {
    return "Strong trade quality. Keep following this process and track if this setup repeats profitably.";
  }

  return "This is a decent trade, but keep improving entry quality, psychology, and risk/reward.";
}

function ScoreCard({ title, score }: { title: string; score: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
      <p className="text-sm text-white/40">{title}</p>
      <p className="mt-2 text-2xl font-bold text-blue-300">{score}</p>
    </div>
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