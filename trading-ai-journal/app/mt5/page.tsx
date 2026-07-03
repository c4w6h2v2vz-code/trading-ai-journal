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
            text="Later you will connect your MT5 account or export your trade history."
          />

          <Card
            title="2. Auto Import"
            text="Trades will automatically appear inside your trading journal."
          />

          <Card
            title="3. AI Analysis"
            text="Every completed trade will be reviewed by your personal AI coach."
          />
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-2xl font-semibold">
            MT5 Account Dashboard
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AccountCard title="Broker" value="Not connected" />
            <AccountCard title="Server" value="Not connected" />
            <AccountCard title="Balance" value="$0.00" />
            <AccountCard title="Equity" value="$0.00" />
            <AccountCard title="Today's P/L" value="$0.00" />
            <AccountCard title="Open Trades" value="0" />
            <AccountCard title="Daily Drawdown" value="0%" />
            <AccountCard title="Status" value="Waiting for connection" />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Card({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-xl shadow-black/30">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-3 text-white/50">{text}</p>
    </div>
  );
}

function AccountCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <p className="text-sm text-white/40">{title}</p>
      <p className="mt-2 text-xl font-bold text-white">{value}</p>
    </div>
  );
}