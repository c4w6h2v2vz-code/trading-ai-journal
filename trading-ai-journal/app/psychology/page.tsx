"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";

type Trade = {
  emotion: string | null;
  mistake: string | null;
  profit_loss: number;
};

export default function PsychologyPage() {
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
        .select("emotion, mistake, profit_loss")
        .eq("user_id", user.id);

      setTrades(data || []);
    }

    loadTrades();
  }, [router]);

  const bestEmotion = getBestGroup(trades, "emotion");
  const worstEmotion = getWorstGroup(trades, "emotion");
  const commonMistake = getMostCommon(trades, "mistake");

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-6 py-8">
        <p className="mb-3 w-fit rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1 text-sm text-purple-300">
          Psychology Dashboard
        </p>

        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          Trading Psychology
        </h1>

        <p className="mt-3 text-white/50">
          Understand which emotions and mistakes affect your performance.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Card title="Best Emotion" value={bestEmotion} />
          <Card title="Worst Emotion" value={worstEmotion} />
          <Card title="Most Common Mistake" value={commonMistake} />
        </div>
      </div>
    </AppShell>
  );
}

function getBestGroup(trades: Trade[], key: "emotion") {
  const groups: Record<string, number> = {};

  trades.forEach((trade) => {
    const name = trade[key] || "Unknown";
    groups[name] = (groups[name] || 0) + Number(trade.profit_loss);
  });

  const sorted = Object.entries(groups).sort((a, b) => b[1] - a[1]);
  return sorted.length ? `${sorted[0][0]} (${sorted[0][1]})` : "No data";
}

function getWorstGroup(trades: Trade[], key: "emotion") {
  const groups: Record<string, number> = {};

  trades.forEach((trade) => {
    const name = trade[key] || "Unknown";
    groups[name] = (groups[name] || 0) + Number(trade.profit_loss);
  });

  const sorted = Object.entries(groups).sort((a, b) => a[1] - b[1]);
  return sorted.length ? `${sorted[0][0]} (${sorted[0][1]})` : "No data";
}

function getMostCommon(trades: Trade[], key: "mistake") {
  const groups: Record<string, number> = {};

  trades.forEach((trade) => {
    const name = trade[key] || "None";
    groups[name] = (groups[name] || 0) + 1;
  });

  const sorted = Object.entries(groups).sort((a, b) => b[1] - a[1]);
  return sorted.length ? `${sorted[0][0]} (${sorted[0][1]})` : "No data";
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/40">
      <p className="text-sm text-white/40">{title}</p>
      <h2 className="mt-3 text-2xl font-bold text-purple-300">{value}</h2>
    </div>
  );
}