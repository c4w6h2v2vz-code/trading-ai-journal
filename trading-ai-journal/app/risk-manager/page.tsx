"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";

// Pip value per 1.0 standard lot, in USD.
// unit = what the user types their stop in.
const INSTRUMENTS: Record<string, {
  label: string;
  unit: "pips" | "dollars" | "points";
  pipValuePerLot: number | "jpy"; // USD per unit per 1.0 lot; "jpy" = needs USDJPY rate
  hint: string;
}> = {
  EURUSD: { label: "EUR/USD", unit: "pips", pipValuePerLot: 10, hint: "1 pip = 4th decimal (1.13800 → 1.13810 = 1 pip)" },
  GBPUSD: { label: "GBP/USD", unit: "pips", pipValuePerLot: 10, hint: "1 pip = 4th decimal (1.27400 → 1.27410 = 1 pip)" },
  AUDUSD: { label: "AUD/USD", unit: "pips", pipValuePerLot: 10, hint: "1 pip = 4th decimal" },
  NZDUSD: { label: "NZD/USD", unit: "pips", pipValuePerLot: 10, hint: "1 pip = 4th decimal" },
  USDJPY: { label: "USD/JPY", unit: "pips", pipValuePerLot: "jpy", hint: "1 pip = 2nd decimal (150.00 → 150.01 = 1 pip)" },
  GBPJPY: { label: "GBP/JPY", unit: "pips", pipValuePerLot: "jpy", hint: "1 pip = 2nd decimal (190.00 → 190.01 = 1 pip)" },
  EURJPY: { label: "EUR/JPY", unit: "pips", pipValuePerLot: "jpy", hint: "1 pip = 2nd decimal" },
  XAUUSD: { label: "Gold (XAU/USD)", unit: "dollars", pipValuePerLot: 100, hint: "Enter your stop in DOLLARS of movement (4062 → 4022 = 40 dollars). 1.0 lot = $100 per $1 move." },
  US30: { label: "US30 (Dow)", unit: "points", pipValuePerLot: 1, hint: "Enter stop in POINTS (52000 → 51950 = 50 points). Varies by broker." },
  NAS100: { label: "NAS100 (Nasdaq)", unit: "points", pipValuePerLot: 1, hint: "Enter stop in POINTS. Varies by broker." },
};

export default function RiskManagerPage() {
  const [accountSize, setAccountSize] = useState("10000");
  const [riskPercent, setRiskPercent] = useState(2);
  const [instrument, setInstrument] = useState("XAUUSD");
  const [stopUnits, setStopUnits] = useState("");
  const [targetUnits, setTargetUnits] = useState("");
  const [usdJpyRate, setUsdJpyRate] = useState("150");

  const spec = INSTRUMENTS[instrument];
  const acct = parseFloat(accountSize) || 0;
  const stopN = parseFloat(stopUnits);
  const targetN = parseFloat(targetUnits);
  const jpyRate = parseFloat(usdJpyRate) || 0;

  const riskAmount = acct * (riskPercent / 100);

  // Value per unit (pip/dollar/point) per 1.0 lot
  let valuePerUnitPerLot: number | null = null;
  if (spec.pipValuePerLot === "jpy") {
    valuePerUnitPerLot = jpyRate > 0 ? (1000 / jpyRate) : null; // JPY pair: (100000 * 0.01) / rate = 1000/rate
  } else {
    valuePerUnitPerLot = spec.pipValuePerLot;
  }

  let lotSize: number | null = null;
  if (!isNaN(stopN) && stopN > 0 && valuePerUnitPerLot && riskAmount > 0) {
    lotSize = riskAmount / (stopN * valuePerUnitPerLot);
  }

  // Per-lot value of the actual position
  const perUnitValue = lotSize != null && valuePerUnitPerLot != null ? lotSize * valuePerUnitPerLot : null;

  // Target profit + R:R
  let targetProfit: number | null = null;
  let rr: number | null = null;
  if (!isNaN(targetN) && targetN > 0 && perUnitValue != null) {
    targetProfit = targetN * perUnitValue;
    if (!isNaN(stopN) && stopN > 0) rr = targetN / stopN;
  }

  const unitLabel = spec.unit === "pips" ? "pips" : spec.unit === "dollars" ? "dollars" : "points";
  const isJPY = spec.pipValuePerLot === "jpy";

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6">
          <p className="text-xs font-medium uppercase tracking-wider text-blue-400">Risk Manager</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Lot Size Calculator</h1>
          <p className="mt-1 text-sm text-white/40">
            Set your account and risk, enter your stop distance, and get the exact lot size. Same formula the pros use.
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
                <button key={key} onClick={() => { setInstrument(key); }} className={`rounded-xl px-2 py-2 text-xs font-semibold transition ${instrument === key ? "bg-blue-600 text-white" : "bg-white/[0.05] text-white/50 hover:bg-white/10"}`}>
                  {key}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-white/40">{spec.label}</p>
            <p className="mt-1 rounded-lg bg-black/30 p-2 text-[11px] text-white/40">{spec.hint}</p>
          </div>

          {/* Stop + target */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs text-white/40">Stop Loss ({unitLabel})</label>
                <input type="number" step="any" value={stopUnits} onChange={e => setStopUnits(e.target.value)} placeholder={spec.unit === "dollars" ? "e.g. 40" : "e.g. 30"} className="w-full rounded-xl border border-white/10 bg-black/50 p-2.5 text-sm text-white outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/40">Target ({unitLabel}) — optional</label>
                <input type="number" step="any" value={targetUnits} onChange={e => setTargetUnits(e.target.value)} placeholder="e.g. 60" className="w-full rounded-xl border border-white/10 bg-black/50 p-2.5 text-sm text-white outline-none focus:border-blue-500" />
              </div>
            </div>

            {isJPY && (
              <div className="mt-3">
                <label className="mb-1 block text-xs text-white/40">Current USD/JPY rate</label>
                <input type="number" step="any" value={usdJpyRate} onChange={e => setUsdJpyRate(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/50 p-2.5 text-sm text-white outline-none focus:border-blue-500" />
                <p className="mt-1 text-[10px] text-white/25">JPY pairs settle in yen — this converts pip value to USD.</p>
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
                    <p className="text-sm font-semibold tabular-nums text-red-400">-${riskAmount.toFixed(2)}</p>
                  </div>
                  <div className="rounded-xl bg-black/30 p-2 text-center">
                    <p className="text-[10px] text-white/30">Per {unitLabel.slice(0, -1)}</p>
                    <p className="text-sm font-semibold tabular-nums">${perUnitValue?.toFixed(2)}</p>
                  </div>
                  <div className="rounded-xl bg-black/30 p-2 text-center">
                    <p className="text-[10px] text-white/30">Target profit</p>
                    <p className="text-sm font-semibold tabular-nums text-emerald-400">{targetProfit != null ? `+$${targetProfit.toFixed(2)}` : "—"}</p>
                  </div>
                </div>
                {rr != null && (
                  <p className="mt-3 text-center text-xs text-white/50">Risk/Reward ratio: <span className="font-semibold text-white/80">1:{rr.toFixed(2)}</span></p>
                )}
              </>
            ) : (
              <p className="text-center text-sm text-white/40">Enter your stop loss distance to calculate your lot size.</p>
            )}
          </div>

          <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/[0.06] p-4">
            <p className="text-xs text-yellow-300">
              These use standard broker contract sizes. Gold and indices pip definitions vary by broker. Verify once: calculate a lot here, place it in MT5, and check the risk matches. If it's off, tell me your broker's contract size and I'll adjust.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}