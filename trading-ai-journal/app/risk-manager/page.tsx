"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";

// Instrument specs. contractSize = units per 1.0 lot.
// quote tells us how to convert P/L to USD.
const INSTRUMENTS: Record<string, { label: string; contractSize: number; quote: "USD" | "JPY" | "DIRECT"; pipSize: number; decimals: number }> = {
  EURUSD: { label: "EUR/USD", contractSize: 100000, quote: "USD", pipSize: 0.0001, decimals: 5 },
  GBPUSD: { label: "GBP/USD", contractSize: 100000, quote: "USD", pipSize: 0.0001, decimals: 5 },
  AUDUSD: { label: "AUD/USD", contractSize: 100000, quote: "USD", pipSize: 0.0001, decimals: 5 },
  NZDUSD: { label: "NZD/USD", contractSize: 100000, quote: "USD", pipSize: 0.0001, decimals: 5 },
  USDJPY: { label: "USD/JPY", contractSize: 100000, quote: "JPY", pipSize: 0.01, decimals: 3 },
  GBPJPY: { label: "GBP/JPY", contractSize: 100000, quote: "JPY", pipSize: 0.01, decimals: 3 },
  EURJPY: { label: "EUR/JPY", contractSize: 100000, quote: "JPY", pipSize: 0.01, decimals: 3 },
  XAUUSD: { label: "Gold (XAU/USD)", contractSize: 100, quote: "USD", pipSize: 0.1, decimals: 2 },
  US30: { label: "US30 (Dow)", contractSize: 1, quote: "USD", pipSize: 1, decimals: 1 },
  NAS100: { label: "NAS100 (Nasdaq)", contractSize: 1, quote: "USD", pipSize: 1, decimals: 1 },
};

export default function RiskManagerPage() {
  const [accountSize, setAccountSize] = useState("10000");
  const [riskPercent, setRiskPercent] = useState(2);
  const [instrument, setInstrument] = useState("EURUSD");
  const [entry, setEntry] = useState("");
  const [stop, setStop] = useState("");
  const [usdJpyRate, setUsdJpyRate] = useState("150");

  const spec = INSTRUMENTS[instrument];
  const acct = parseFloat(accountSize) || 0;
  const entryN = parseFloat(entry);
  const stopN = parseFloat(stop);
  const jpyRate = parseFloat(usdJpyRate) || 0;

  const riskAmount = acct * (riskPercent / 100);
  const stopDistance = !isNaN(entryN) && !isNaN(stopN) ? Math.abs(entryN - stopN) : null;

  // Value of a full 1.0 lot per 1.0 price move, in USD
  let valuePerPricePerLot: number | null = null;
  if (spec.quote === "USD") {
    valuePerPricePerLot = spec.contractSize; // e.g. forex USD-quote: 100000 units * 1.0 price = $100000 per 1.0 price... but price move of 1.0 is huge
  } else if (spec.quote === "JPY") {
    valuePerPricePerLot = jpyRate > 0 ? spec.contractSize / jpyRate : null;
  }

  let lotSize: number | null = null;
  if (stopDistance && stopDistance > 0 && valuePerPricePerLot && riskAmount > 0) {
    lotSize = riskAmount / (stopDistance * valuePerPricePerLot);
  }

  // pips in the stop, for display
  const stopPips = stopDistance != null ? stopDistance / spec.pipSize : null;

  const isJPY = spec.quote === "JPY";

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6">
          <p className="text-xs font-medium uppercase tracking-wider text-blue-400">Risk Manager</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Lot Size Calculator</h1>
          <p className="mt-1 text-sm text-white/40">
            Enter your account, risk, and stop. Get the exact lot size so you never risk more than you planned.
          </p>
        </div>

        <div className="space-y-5">
          {/* Account + risk */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs text-white/40">Account Size ($)</label>
                <input type="number" value={accountSize} onChange={e => setAccountSize(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/50 p-2.5 text-sm text-white outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/40">Risk %</label>
                <div className="flex gap-1.5">
                  {[1, 2, 3].map(r => (
                    <button key={r} onClick={() => setRiskPercent(r)} className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${riskPercent === r ? "bg-blue-600 text-white" : "bg-white/[0.05] text-white/40 hover:bg-white/10"}`}>{r}%</button>
                  ))}
                  <input type="number" step="0.1" value={riskPercent} onChange={e => setRiskPercent(Number(e.target.value))} className="w-16 rounded-xl border border-white/10 bg-black/50 p-2 text-center text-sm text-white outline-none focus:border-blue-500" />
                </div>
              </div>
            </div>
            <div className="mt-3 rounded-xl bg-blue-500/[0.08] p-3 text-center">
              <p className="text-xs text-white/40">You will risk</p>
              <p className="text-xl font-semibold text-blue-300 tabular-nums">${riskAmount.toFixed(2)}</p>
            </div>
          </div>

          {/* Instrument */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <label className="mb-2 block text-xs text-white/40">Pair / Instrument</label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {Object.keys(INSTRUMENTS).map(key => (
                <button key={key} onClick={() => setInstrument(key)} className={`rounded-xl px-2 py-2 text-xs font-semibold transition ${instrument === key ? "bg-blue-600 text-white" : "bg-white/[0.05] text-white/50 hover:bg-white/10"}`}>
                  {key}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-white/30">{spec.label}</p>
          </div>

          {/* Entry + stop */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs text-white/40">Entry Price</label>
                <input type="number" step="any" value={entry} onChange={e => setEntry(e.target.value)} placeholder={instrument === "XAUUSD" ? "e.g. 4078.20" : instrument === "US30" ? "e.g. 52000" : "e.g. 1.13800"} className="w-full rounded-xl border border-white/10 bg-black/50 p-2.5 text-sm text-white outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/40">Stop Loss Price</label>
                <input type="number" step="any" value={stop} onChange={e => setStop(e.target.value)} placeholder="your stop price" className="w-full rounded-xl border border-white/10 bg-black/50 p-2.5 text-sm text-white outline-none focus:border-blue-500" />
              </div>
            </div>

            {isJPY && (
              <div className="mt-3">
                <label className="mb-1 block text-xs text-white/40">Current USD/JPY rate (for JPY pairs)</label>
                <input type="number" step="any" value={usdJpyRate} onChange={e => setUsdJpyRate(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/50 p-2.5 text-sm text-white outline-none focus:border-blue-500" />
                <p className="mt-1 text-[10px] text-white/25">JPY pairs settle in yen — we use this rate to convert to USD.</p>
              </div>
            )}
          </div>

          {/* Result */}
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-5">
            {lotSize != null ? (
              <>
                <p className="text-center text-xs font-medium uppercase tracking-wide text-white/40">Use this lot size</p>
                <p className="mt-1 text-center text-4xl font-bold text-emerald-400 tabular-nums">{lotSize.toFixed(2)}</p>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-black/30 p-2 text-center">
                    <p className="text-[10px] text-white/30">Risk</p>
                    <p className="text-sm font-semibold tabular-nums">${riskAmount.toFixed(2)}</p>
                  </div>
                  <div className="rounded-xl bg-black/30 p-2 text-center">
                    <p className="text-[10px] text-white/30">Stop distance</p>
                    <p className="text-sm font-semibold tabular-nums">{stopDistance?.toFixed(spec.decimals)}</p>
                  </div>
                  <div className="rounded-xl bg-black/30 p-2 text-center">
                    <p className="text-[10px] text-white/30">Stop (pips)</p>
                    <p className="text-sm font-semibold tabular-nums">{stopPips?.toFixed(0)}</p>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-center text-sm text-white/40">Enter entry and stop prices to calculate your lot size.</p>
            )}
          </div>

          <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/[0.06] p-4">
            <p className="text-xs text-yellow-300">
              Contract sizes are broker standards. Before trusting this, verify once: calculate a lot size here, then compare to one real MT5 trade where you know the risk. If your broker's contract size differs (especially on indices), tell me and I'll adjust.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}