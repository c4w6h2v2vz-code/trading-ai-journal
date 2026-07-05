"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";

export default function ReportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState("");
  const [summary, setSummary] = useState<any>(null);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUserId(user.id);
    }
    getUser();
  }, []);

  async function generateReport() {
    setLoading(true);
    setReport("");
    try {
      const response = await fetch("/api/weekly-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await response.json();
      setReport(data.report || "Could not generate report.");
      setSummary(data.summary || null);
    } catch (err) {
      setReport("Error: " + String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-10">
          <p className="mb-3 w-fit rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1 text-sm text-blue-300">
            AI Reports
          </p>
          <h1 className="text-4xl font-bold tracking-tight">Weekly AI Report</h1>
          <p className="mt-3 text-white/50">
            Get a full AI-generated coaching report based on your last 7 days of trading.
          </p>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Trades" value={String(summary.totalTrades)} />
            <StatCard label="Win Rate" value={`${summary.winRate}%`} color="text-blue-400" />
            <StatCard label="Net P/L" value={`$${summary.totalPL}`} color={Number(summary.totalPL) >= 0 ? "text-green-400" : "text-red-400"} />
            <StatCard label="Wins / Losses" value={`${summary.wins} / ${summary.losses}`} />
          </div>
        )}

        {/* Generate Button */}
        <div className="mb-8 rounded-3xl border border-blue-500/20 bg-blue-500/5 p-6">
          <h2 className="mb-2 text-xl font-semibold">Generate This Week's Report</h2>
          <p className="mb-4 text-sm text-white/40">
            AI will analyze your last 7 days of trades and give you a full coaching report.
          </p>
          <button
            onClick={generateReport}
            disabled={loading || !userId}
            className="rounded-2xl bg-blue-600 px-6 py-3 font-semibold transition hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Generating Report..." : "Generate Weekly Report"}
          </button>
        </div>

        {/* Report */}
        {report && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <h2 className="mb-4 text-xl font-semibold">Your Weekly Report</h2>
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-white/80">
              {report}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <p className="text-sm text-white/40">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${color || "text-white"}`}>{value}</p>
    </div>
  );
}