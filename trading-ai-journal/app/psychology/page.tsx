"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";

type Trade = {
  id: string;
  pair: string;
  result: string;
  profit_loss: number;
  emotion: string | null;
  mistake: string | null;
  strategy: string | null;
  grade: string | null;
  created_at: string;
  ai_score: number | null;
};

type CoachInsight = {
  type: "warning" | "success" | "info";
  title: string;
  message: string;
};

export default function PsychologyPage() {
  const router = useRouter();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [insights, setInsights] = useState<CoachInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReport, setAiReport] = useState("");

  useEffect(() => {
    async function loadTrades() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data } = await supabase
        .from("trades")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      const tradeList = data || [];
      setTrades(tradeList);
      generateInsights(tradeList);
      setLoading(false);
    }
    loadTrades();
  }, []);

  function generateInsights(trades: Trade[]) {
    const insights: CoachInsight[] = [];
    if (trades.length === 0) return;

    // Revenge trading detection
    for (let i = 0; i < trades.length - 1; i++) {
      if (trades[i].profit_loss < 0 && trades[i + 1].profit_loss < 0) {
        insights.push({
          type: "warning",
          title: "⚠️ Revenge Trading Detected",
          message: "You took consecutive losing trades. This is a sign of revenge trading. Always take a break after a loss.",
        });
        break;
      }
    }

    // FOMO detection
    const fomoTrades = trades.filter(t => t.emotion === "FOMO");
    if (fomoTrades.length > 0) {
      const fomoWinRate = fomoTrades.filter(t => t.result === "Win").length / fomoTrades.length * 100;
      insights.push({
        type: "warning",
        title: `⚠️ FOMO Trading — ${fomoTrades.length} trades`,
        message: `Your FOMO trades have a ${fomoWinRate.toFixed(0)}% win rate. FOMO entries are costing you money.`,
      });
    }

    // Greed detection
    const greedTrades = trades.filter(t => t.emotion === "Greed");
    if (greedTrades.length > 0) {
      insights.push({
        type: "warning",
        title: `⚠️ Greed Detected — ${greedTrades.length} trades`,
        message: "You've traded with greed. Greedy traders overtrade and ignore their rules.",
      });
    }

    // Best emotion
    const emotionMap: Record<string, { pl: number; count: number }> = {};
    trades.forEach(t => {
      const e = t.emotion || "Unknown";
      if (!emotionMap[e]) emotionMap[e] = { pl: 0, count: 0 };
      emotionMap[e].pl += t.profit_loss;
      emotionMap[e].count++;
    });
    const bestEmotion = Object.entries(emotionMap).sort((a, b) => b[1].pl - a[1].pl)[0];
    if (bestEmotion) {
      insights.push({
        type: "success",
        title: `✅ Best State: ${bestEmotion[0]}`,
        message: `You perform best when feeling ${bestEmotion[0]}. P/L: $${bestEmotion[1].pl.toFixed(2)} across ${bestEmotion[1].count} trades.`,
      });
    }

    // Most common mistake
    const mistakeMap: Record<string, number> = {};
    trades.forEach(t => { if (t.mistake) mistakeMap[t.mistake] = (mistakeMap[t.mistake] || 0) + 1; });
    const topMistake = Object.entries(mistakeMap).sort((a, b) => b[1] - a[1])[0];
    if (topMistake) {
      insights.push({
        type: "warning",
        title: `🔁 Repeated Mistake: "${topMistake[0]}"`,
        message: `You've made this mistake ${topMistake[1]} times. This is your #1 pattern to fix.`,
      });
    }

    // Consistency check
    const last7 = trades.slice(0, 7);
    const last7Wins = last7.filter(t => t.result === "Win").length;
    const last7WR = last7.length > 0 ? (last7Wins / last7.length * 100).toFixed(0) : "0";
    insights.push({
      type: Number(last7WR) >= 50 ? "success" : "warning",
      title: `📊 Last 7 Trades: ${last7WR}% Win Rate`,
      message: Number(last7WR) >= 50
        ? "You're in good form. Stay disciplined and stick to your rules."
        : "Your recent performance is below 50%. Consider reducing size or taking a break.",
    });

    // Grade analysis
    const gradedTrades = trades.filter(t => t.grade);
    const aGrades = gradedTrades.filter(t => t.grade === "A+" || t.grade === "A");
    const aWinRate = aGrades.length > 0 ? (aGrades.filter(t => t.result === "Win").length / aGrades.length * 100).toFixed(0) : "0";
    if (aGrades.length > 0) {
      insights.push({
        type: "success",
        title: `🏆 A-Grade Setups: ${aWinRate}% Win Rate`,
        message: `Your best setups (A/A+) win ${aWinRate}% of the time. Focus only on these setups.`,
      });
    }

    setInsights(insights);
  }

  async function generateAiCoachReport() {
    setAiLoading(true);
    setAiReport("");
    try {
      const summary = {
        totalTrades: trades.length,
        winRate: (trades.filter(t => t.result === "Win").length / trades.length * 100).toFixed(1),
        emotions: [...new Set(trades.map(t => t.emotion).filter(Boolean))],
        mistakes: trades.map(t => t.mistake).filter(Boolean),
        recentTrades: trades.slice(0, 5).map(t => ({
          pair: t.pair,
          result: t.result,
          emotion: t.emotion,
          mistake: t.mistake,
          pl: t.profit_loss,
        })),
      };

      const response = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(summary),
      });

      const data = await response.json();
      setAiReport(data.report || "Could not generate report.");
    } catch (err) {
      setAiReport("Error: " + String(err));
    } finally {
      setAiLoading(false);
    }
  }

  // Emotion stats
  const emotionMap: Record<string, { wins: number; total: number; pl: number }> = {};
  trades.forEach(t => {
    const e = t.emotion || "Unknown";
    if (!emotionMap[e]) emotionMap[e] = { wins: 0, total: 0, pl: 0 };
    emotionMap[e].total++;
    emotionMap[e].pl += t.profit_loss;
    if (t.result === "Win") emotionMap[e].wins++;
  });

  const mistakeMap: Record<string, number> = {};
  trades.forEach(t => { if (t.mistake) mistakeMap[t.mistake] = (mistakeMap[t.mistake] || 0) + 1; });

  if (loading) return (
    <AppShell>
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-white/40">Loading psychology data...</p>
      </div>
    </AppShell>
  );

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-6 py-8">

        <div className="mb-10">
          <p className="mb-3 w-fit rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1 text-sm text-purple-300">
            AI Coach
          </p>
          <h1 className="text-4xl font-bold tracking-tight">Trading Psychology</h1>
          <p className="mt-3 text-white/50">AI-powered coaching based on your real trade history.</p>
        </div>

        {/* AI Coach Insights */}
        <div className="mb-8 space-y-4">
          <h2 className="text-xl font-semibold">AI Coach Insights</h2>
          {insights.length === 0 ? (
            <p className="text-white/40">Add more trades to get AI coaching insights.</p>
          ) : (
            insights.map((insight, i) => (
              <div key={i} className={`rounded-3xl border p-5 ${
                insight.type === "warning"
                  ? "border-yellow-500/20 bg-yellow-500/5"
                  : insight.type === "success"
                  ? "border-green-500/20 bg-green-500/5"
                  : "border-blue-500/20 bg-blue-500/5"
              }`}>
                <p className={`font-semibold ${
                  insight.type === "warning" ? "text-yellow-400"
                  : insight.type === "success" ? "text-green-400"
                  : "text-blue-400"
                }`}>{insight.title}</p>
                <p className="mt-2 text-sm text-white/60">{insight.message}</p>
              </div>
            ))
          )}
        </div>

        {/* AI Personal Report */}
        <div className="mb-8 rounded-3xl border border-purple-500/20 bg-purple-500/5 p-6">
          <h2 className="mb-2 text-xl font-semibold">Personal AI Coaching Report</h2>
          <p className="mb-4 text-sm text-white/40">Get a full coaching report based on all your trades.</p>
          <button
            onClick={generateAiCoachReport}
            disabled={aiLoading}
            className="rounded-2xl bg-purple-600 px-6 py-3 font-semibold transition hover:bg-purple-700 disabled:opacity-50"
          >
            {aiLoading ? "Generating Report..." : "Generate AI Coaching Report"}
          </button>
          {aiReport && (
            <div className="mt-6 rounded-2xl border border-purple-500/20 bg-black/30 p-4 text-sm text-white/80 leading-relaxed">
              {aiReport}
            </div>
          )}
        </div>

        {/* Emotion Performance */}
        <div className="mb-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="mb-4 text-xl font-semibold">Emotion Performance</h2>
          <div className="space-y-3">
            {Object.entries(emotionMap).sort((a, b) => b[1].pl - a[1].pl).map(([emotion, stats]) => (
              <div key={emotion} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="font-semibold">{emotion}</p>
                <div className="flex gap-4 text-sm">
                  <span className="text-white/40">{stats.total} trades</span>
                  <span className="text-blue-400">{((stats.wins / stats.total) * 100).toFixed(0)}% WR</span>
                  <span className={stats.pl >= 0 ? "text-green-400" : "text-red-400"}>${stats.pl.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mistake Frequency */}
        {Object.keys(mistakeMap).length > 0 && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <h2 className="mb-4 text-xl font-semibold">Mistake Frequency</h2>
            <div className="space-y-3">
              {Object.entries(mistakeMap).sort((a, b) => b[1] - a[1]).map(([mistake, count]) => (
                <div key={mistake} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="text-white/80">{mistake}</p>
                  <span className="rounded-full bg-red-500/10 px-3 py-1 text-sm text-red-400">{count}x</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}