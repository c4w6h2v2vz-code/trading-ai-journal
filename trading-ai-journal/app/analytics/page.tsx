"use client";

import AppShell from "@/components/AppShell";

export default function AnalyticsPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-6 py-8">
        <p className="mb-3 w-fit rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1 text-sm text-blue-300">
          Performance Analytics
        </p>

        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          Trading Analytics
        </h1>

        <p className="mt-3 text-white/50">
          Track your trading performance, mistakes, strengths, and consistency.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Trades" value="0" />
          <StatCard title="Win Rate" value="0%" />
          <StatCard title="Profit Factor" value="0.00" />
          <StatCard title="Expectancy" value="$0.00" />
          <StatCard title="Average Win" value="$0.00" />
          <StatCard title="Average Loss" value="$0.00" />
          <StatCard title="Best Session" value="N/A" />
          <StatCard title="Worst Session" value="N/A" />
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-2xl font-semibold">Analytics Engine</h2>
          <p className="mt-3 text-white/60">
            This page will later calculate real performance statistics from your
            trading journal database.
          </p>
        </div>
      </div>
    </AppShell>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/30">
      <p className="text-sm text-white/40">{title}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}