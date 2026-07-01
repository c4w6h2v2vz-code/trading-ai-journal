"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";

type Rule = {
  id: number;
  title: string;
  description: string;
};

const defaultRules: Rule[] = [
  {
    id: 1,
    title: "Minimum 1:2 Risk Reward",
    description: "Only take trades where reward is at least 2x the risk.",
  },
  {
    id: 2,
    title: "Trade London or New York only",
    description: "Avoid low-volume sessions unless the setup is very clear.",
  },
  {
    id: 3,
    title: "No FOMO entries",
    description: "Wait for confirmation before entering the trade.",
  },
  {
    id: 4,
    title: "Never revenge trade",
    description: "After a loss, pause and reset before taking another trade.",
  },
];

export default function TradingRulesPage() {
  const [rules, setRules] = useState<Rule[]>(defaultRules);

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-6 py-8">
        <p className="mb-3 w-fit rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1 text-sm text-blue-300">
          Personal Trading System
        </p>

        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          My Trading Rules
        </h1>

        <p className="mt-3 text-white/50">
          These rules will later be used by your AI coach to judge every trade.
        </p>

        <div className="mt-8 space-y-4">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/30"
            >
              <h2 className="text-xl font-semibold">{rule.title}</h2>
              <p className="mt-2 text-white/50">{rule.description}</p>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}