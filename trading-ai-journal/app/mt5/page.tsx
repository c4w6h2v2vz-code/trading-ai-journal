"use client";

import AppShell from "@/components/AppShell";

export default function MT5Page() {
  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-6 py-8">
        <p className="mb-3 w-fit rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1 text-sm text-blue-300">
          MT5 Integration
        </p>

        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          Connect MetaTrader 5
        </h1>

        <p className="mt-3 text-white/50">
          Prepare your journal to receive trades automatically from MT5.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <Card
            title="1. MT5 Account"
            text="Later you will connect your MT5 account or export trade history."
          />
          <Card
            title="2. Auto Import"
            text="Trades will be saved automatically into your journal database."
          />
          <Card
            title="3. AI Analysis"
            text="After each trade closes, the AI coach can review your execution."
          />
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-2xl font-semibold">Coming Next</h2>
          <p className="mt-3 text-white/60">
            We will build the database structure for imported MT5 trades, then
            later connect MT5 using an Expert Advisor or trade export system.
          </p>
        </div>
      </div>
    </AppShell>
  );
}

function Card({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-xl shadow-black/30">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-3 text-white/50">{text}</p>
    </div>
  );
}