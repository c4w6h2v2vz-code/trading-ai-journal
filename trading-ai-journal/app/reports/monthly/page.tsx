"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";

type MonthlyReport = {
  overall_grade: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  best_pair: string;
  worst_pair: string;
  main_mistake: string;
  coach_advice: string;
};

export default function MonthlyReportPage() {
  const router = useRouter();

  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function generateReport() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        const { data: trades, error } = await supabase
          .from("trades")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          setMessage("Error loading trades: " + error.message);
          return;
        }

        if (!trades || trades.length === 0) {
          setMessage("No trades found yet. Add trades first to generate a report.");
          return;
        }

        const response = await fetch("/api/monthly-report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trades }),
        });

        const data = await response.json();

        if (!response.ok || data.error) {
          throw new Error(data.details || data.error || "Report failed");
        }

        setReport(data);
      } catch (error) {
        setMessage("Could not generate report: " + String(error));
      } finally {
        setLoading(false);
      }
    }

    generateReport();
  }, [router]);

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-6 py-8">
        <p className="mb-3 w-fit rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1 text-sm text-blue-300">
          AI Performance Report
        </p>

        <h1 className="text-5xl font-bold">Monthly Trading Report</h1>

        <p className="mt-3 text-white/50">
          AI analyzes your trades and creates a real monthly performance review.
        </p>

        {loading && (
          <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-white/60">
            Generating your AI monthly report...
          </div>
        )}

        {message && !loading && (
          <div className="mt-10 rounded-3xl border border-red-500/20 bg-red-500/10 p-8 text-red-300">
            {message}
          </div>
        )}

        {report && !loading && (
          <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <h2 className="text-3xl font-bold">AI Monthly Review</h2>

            <p className="mt-6 text-white/70">Overall Grade:</p>
            <p className="text-6xl font-bold text-blue-400">
              {report.overall_grade}
            </p>

            <p className="mt-6 text-white/70">{report.summary}</p>

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <ReportCard title="Strengths" items={report.strengths || []} />
              <ReportCard title="Weaknesses" items={report.weaknesses || []} />
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <SmallCard title="Best Pair" value={report.best_pair || "N/A"} />
              <SmallCard title="Worst Pair" value={report.worst_pair || "N/A"} />
              <SmallCard title="Main Mistake" value={report.main_mistake || "N/A"} />
            </div>

            <div className="mt-8 rounded-3xl border border-blue-500/20 bg-blue-500/10 p-6">
              <h3 className="text-xl font-semibold text-blue-300">
                AI Coach Advice
              </h3>
              <p className="mt-3 text-white/70">{report.coach_advice}</p>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function ReportCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/30 p-6">
      <h3 className="text-xl font-semibold">{title}</h3>

      {items.length === 0 ? (
        <p className="mt-4 text-white/40">No data available.</p>
      ) : (
        <ul className="mt-4 list-disc space-y-2 pl-6 text-white/70">
          {items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SmallCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
      <p className="text-sm text-white/40">{title}</p>
      <p className="mt-2 text-xl font-bold">{value}</p>
    </div>
  );
}