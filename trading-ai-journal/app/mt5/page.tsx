"use client";

import AppShell from "@/components/AppShell";
import { useEffect, useState } from "react";

type MT5Data = {
  source?: string;
  event?: string;
  account?: string;
  server?: string;
  balance?: number;
  equity?: number;
  receivedAt?: string;
};

export default function MT5Page() {
  const [mt5Data, setMt5Data] = useState<MT5Data | null>(null);
  const [connected, setConnected] = useState(false);
  const [message, setMessage] = useState("Loading MT5 connection...");

  async function loadMT5Data() {
    try {
      const response = await fetch("/api/mt5", {
        cache: "no-store",
      });

      const result = await response.json();

      setConnected(result.connected);
      setMt5Data(result.data);

      if (result.connected) {
        setMessage("✅ MT5 connected successfully");
      } else {
        setMessage("Waiting for MT5 connection");
      }
    } catch {
      setMessage("❌ Could not load MT5 data");
    }
  }

  useEffect(() => {
    loadMT5Data();

    const interval = setInterval(loadMT5Data, 5000);

    return () => clearInterval(interval);
  }, []);

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
          Your FTMO MT5 account is connected to your AI Trading Journal.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <Card
            title="1. MT5 Account"
            text="Your FTMO account sends data directly to your journal."
          />

          <Card
            title="2. Auto Import"
            text="Next we will send real trades automatically."
          />

          <Card
            title="3. AI Analysis"
            text="After each completed trade, AI will review your execution."
          />
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-semibold">MT5 Account Dashboard</h2>

            <button
              onClick={loadMT5Data}
              className="rounded-2xl bg-blue-500 px-4 py-2 font-semibold text-white hover:bg-blue-400"
            >
              Refresh
            </button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AccountCard title="Broker" value="FTMO" />
            <AccountCard title="Account" value={mt5Data?.account || "Not connected"} />
            <AccountCard title="Server" value={mt5Data?.server || "Not connected"} />
            <AccountCard
              title="Balance"
              value={`$${Number(mt5Data?.balance || 0).toLocaleString()}`}
            />
            <AccountCard
              title="Equity"
              value={`$${Number(mt5Data?.equity || 0).toLocaleString()}`}
            />
            <AccountCard title="Today's P/L" value="$0.00" />
            <AccountCard title="Open Trades" value="0" />
            <AccountCard
              title="Status"
              value={connected ? "Connected" : "Waiting for connection"}
            />
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-blue-500/20 bg-blue-500/10 p-6">
          <h2 className="text-2xl font-semibold">MT5 Connection Status</h2>

          <p className="mt-3 text-white/70">{message}</p>

          {mt5Data?.receivedAt && (
            <p className="mt-3 text-sm text-white/40">
              Last update: {new Date(mt5Data.receivedAt).toLocaleString()}
            </p>
          )}
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