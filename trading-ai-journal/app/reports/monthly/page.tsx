"use client";

import AppShell from "@/components/AppShell";

export default function MonthlyReportPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-6 py-8">
        <p className="mb-3 w-fit rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1 text-sm text-blue-300">
          AI Performance Report
        </p>

        <h1 className="text-5xl font-bold">
          Monthly Trading Report
        </h1>

        <p className="mt-3 text-white/50">
          AI analyzes all of your trades and provides a monthly performance review.
        </p>

        <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <h2 className="text-3xl font-bold">
            July 2026 Report
          </h2>

          <p className="mt-6 text-white/70">
            Overall Grade:
          </p>

          <p className="text-6xl font-bold text-blue-400">
            A-
          </p>

          <div className="mt-10 space-y-6">

            <div>
              <h3 className="text-xl font-semibold">
                Strengths
              </h3>

              <ul className="mt-2 list-disc pl-6 text-white/70">
                <li>Excellent patience</li>
                <li>Good risk management</li>
                <li>Consistent execution</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold">
                Weaknesses
              </h3>

              <ul className="mt-2 list-disc pl-6 text-white/70">
                <li>Entering too early</li>
                <li>Occasional FOMO trades</li>
                <li>Trading outside your rules</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold">
                AI Coach Advice
              </h3>

              <p className="mt-2 text-white/70">
                Continue waiting for confirmation before entering trades.
                Focus on consistency instead of increasing risk.
                Your discipline has improved compared to previous trades.
              </p>
            </div>

          </div>
        </div>
      </div>
    </AppShell>
  );
}