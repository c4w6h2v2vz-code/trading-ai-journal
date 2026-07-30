"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AppShell from "@/components/AppShell";

type Warning = { level: "danger" | "caution" | "good"; message: string };
type Result = { verdict: string; warnings: Warning[]; totalTradesAnalyzed: number; note: string };

export default function PreTradeCheckPage() {
  const router = useRouter();
  const [activeAccount, setActiveAccount] = useState<any>(null);

  const [pair, setPair] = useState("");
  const [day, setDay] = useState(new Date().toLocaleString("en-US", { weekday: "long" }));
  const [session, setSession] = useState("New York");
  const [riskAmount, setRiskAmount] = useState("");

  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("active_account");
    if (saved) setActiveAccount(JSON.parse(saved));
  }, []);

  async function check() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const res = await fetch("/api/pre-trade-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          accountNumber: activeAccount?.account_number ? String(activeAccount.account_number).trim() : null,
          pair: pair.trim() || null,
          day,
          session,
          riskAmount: riskAmount ? Number(riskAmount) : null,
        }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setResult(data);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const sessions = ["Asia", "London", "London-NY Overlap", "New York"];

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6">
          <p className="text-xs font-medium uppercase tracking-wider text-blue-400">Before You Trade</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Pre-Trade Check</h1>
          <p className="mt-1 text-sm text-white/40">
            Enter a trade you're about to take. This checks it against your real history and your daily limit — before you risk money.
          </p>
        </div>

        <div className="mb-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-white/40">Pair</label>
              <input value={pair} onChange={e => setPair(e.target.value)} placeholder="e.g. EURUSD" className="w-full rounded-xl border border-white/10 bg-black/50 p-2.5 text-sm text-white outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/40">Risk amount ($)</label>
              <input type="number" step="any" value={riskAmount} onChange={e => setRiskAmount(e.target.value)} placeholder="e.g. 200" className="w-full rounded-xl border border-white/10 bg-black/50 p-2.5 text-sm text-white outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/40">Day</label>
              <select value={day} onChange={e => setDay(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/50 p-2.5 text-sm text-white outline-none focus:border-blue-500">
                {days.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/40">Session</label>
              <select value={session} onChange={e => setSession(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/50 p-2.5 text-sm text-white outline-none focus:border-blue-500">
                {sessions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <button onClick={check} disabled={loading} className="mt-4 w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold hover:bg-blue-500 disabled:opacity-40">
            {loading ? "Checking against your history..." : "Check This Trade"}
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/[0.07] p-4 text-sm text-red-400">{error}</div>
        )}

        {result && (
          <div className="space-y-4">
            <div className={`rounded-2xl border p-5 text-center ${
              result.verdict === "high_risk" ? "border-red-500/30 bg-red-500/[0.08]" :
              result.verdict === "caution" ? "border-yellow-500/30 bg-yellow-500/[0.08]" :
              "border-emerald-500/30 bg-emerald-500/[0.08]"
            }`}>
              <p className={`text-2xl font-bold ${
                result.verdict === "high_risk" ? "text-red-400" :
                result.verdict === "caution" ? "text-yellow-400" :
                "text-emerald-400"
              }`}>
                {result.verdict === "high_risk" ? "🚫 High Risk Trade" :
                 result.verdict === "caution" ? "⚠️ Trade With Caution" :
                 "✅ No Red Flags"}
              </p>
            </div>

            {result.warnings.length > 0 ? (
              <div className="space-y-2">
                {result.warnings.map((w, i) => (
                  <div key={i} className={`rounded-xl border p-3 ${
                    w.level === "danger" ? "border-red-500/20 bg-red-500/[0.06]" :
                    w.level === "caution" ? "border-yellow-500/20 bg-yellow-500/[0.06]" :
                    "border-emerald-500/20 bg-emerald-500/[0.06]"
                  }`}>
                    <p className={`text-sm ${
                      w.level === "danger" ? "text-red-300" :
                      w.level === "caution" ? "text-yellow-300" :
                      "text-emerald-300"
                    }`}>
                      {w.level === "danger" ? "🔴 " : w.level === "caution" ? "🟡 " : "🟢 "}{w.message}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-white/40">Not enough history to flag anything specific about this trade.</p>
            )}

            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="text-xs text-white/30">{result.note}</p>
              <p className="mt-1 text-xs text-white/20">Analyzed {result.totalTradesAnalyzed} of your real trades. This is not financial advice — it's your own history reflected back.</p>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}