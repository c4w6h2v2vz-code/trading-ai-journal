"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";

export default function RiskManagerPage() {
  const [accountSize, setAccountSize] = useState("");
  const [riskPercent, setRiskPercent] = useState("");
  const [stopLossPips, setStopLossPips] = useState("");
  const [pipValue, setPipValue] = useState("10");

  const riskAmount =
    (Number(accountSize) * Number(riskPercent)) / 100;

  const lotSize =
    Number(stopLossPips) > 0 && Number(pipValue) > 0
      ? riskAmount / (Number(stopLossPips) * Number(pipValue))
      : 0;

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-10">
          <p className="mb-3 w-fit rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1 text-sm text-blue-300">
            Risk Manager
          </p>

          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Position Size Calculator
          </h1>

          <p className="mt-3 text-white/50">
            Calculate risk amount and lot size before entering a trade.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/40">
            <h2 className="mb-6 text-2xl font-semibold">Trade Risk Inputs</h2>

            <div className="space-y-4">
              <Input label="Account Size" value={accountSize} onChange={setAccountSize} placeholder="10000" />
              <Input label="Risk %" value={riskPercent} onChange={setRiskPercent} placeholder="1" />
              <Input label="Stop Loss Pips" value={stopLossPips} onChange={setStopLossPips} placeholder="20" />
              <Input label="Pip Value per 1 Lot" value={pipValue} onChange={setPipValue} placeholder="10" />
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/40">
            <h2 className="mb-6 text-2xl font-semibold">Result</h2>

            <ResultCard title="Money at Risk" value={riskAmount.toFixed(2)} />
            <ResultCard title="Lot Size" value={lotSize.toFixed(2)} />
            <ResultCard title="Risk Rule" value={`${riskPercent || 0}% per trade`} />

            <p className="mt-6 rounded-2xl bg-blue-500/10 p-4 text-sm text-blue-300">
              Tip: Professional traders usually risk 0.5% to 2% per trade.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <p className="mb-2 text-sm text-white/40">{label}</p>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-white/10 bg-black/50 p-4 text-white outline-none focus:border-blue-500"
      />
    </div>
  );
}

function ResultCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="mb-4 rounded-2xl border border-white/10 bg-black/40 p-5">
      <p className="text-sm text-white/40">{title}</p>
      <p className="mt-2 text-3xl font-bold text-green-400">{value}</p>
    </div>
  );
}