"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";

type Pair = {
  name: string;
  symbol: string;
  tdSymbol: string;
  price: string;
  change: string;
  changePercent: string;
  high: string;
  low: string;
  source: string;
  fetchedAt: string;
  available: boolean;
  note?: string;
};

type PairRead = { name: string; read: string; position_in_range: string };

type Analysis = {
  overview: string;
  pairs: PairRead[];
  dollar_context: string;
  gold_context: string;
  indices_context: string;
  what_to_watch: string[];
  data_note: string;
  quotes: Pair[];
  unavailable: string[];
  fetched_at: string;
  sources_used: string[];
};

export default function MarketAnalysisPage() {
  const [data, setData] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function analyze() {
    setLoading(true);
    setError("");
    setData(null);
    try {
      const res = await fetch("/api/market-analysis", { method: "POST", cache: "no-store" });
      const json = await res.json();
      if (json.error) setError(json.error);
      else setData(json);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <p className="text-xs font-medium uppercase tracking-wider text-blue-400">Intelligence</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Market Analysis</h1>
          <p className="mt-1 text-sm text-white/40">
            The pairs you trade — EURUSD, GBPUSD, gold, US30, NAS100 — with live prices and honest daily context. Every number is sourced and timestamped.
          </p>
        </div>

        <button onClick={analyze} disabled={loading} className="mb-6 w-full rounded-2xl bg-blue-600 py-4 text-base font-semibold transition hover:bg-blue-500 disabled:opacity-40">
          {loading ? "Fetching live prices..." : "Analyze My Pairs"}
        </button>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/[0.07] p-4 text-sm text-red-400">{error}</div>
        )}

        {data && (
          <div className="space-y-5">

            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-white/40">
                  Fetched {new Date(data.fetched_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                </p>
                <div className="flex gap-1.5">
                  {data.sources_used.map(s => (
                    <span key={s} className="rounded-full bg-white/[0.06] px-2 py-0.5 text-xs text-white/50">{s}</span>
                  ))}
                </div>
              </div>
              {data.data_note && <p className="mt-2 text-xs text-white/30">{data.data_note}</p>}
            </div>

            {data.unavailable && data.unavailable.length > 0 && (
              <div className="rounded-2xl border border-orange-500/20 bg-orange-500/[0.06] p-4">
                <p className="mb-1 text-xs font-semibold text-orange-400">Some pairs could not be fetched</p>
                {data.unavailable.map((u, i) => (
                  <p key={i} className="text-xs text-orange-300/70">• {u}</p>
                ))}
              </div>
            )}

            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.06] p-5">
              <p className="text-sm text-white/80">{data.overview}</p>
            </div>

            {/* Live price cards */}
            <div className="grid gap-3 sm:grid-cols-2">
              {data.quotes.map(q => {
                const read = data.pairs?.find(p => p.name === q.name);
                const down = q.change.startsWith("-");
                return (
                  <div key={q.name} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <div className="mb-2 flex items-start justify-between">
                      <p className="text-sm font-semibold">{q.name}</p>
                      {q.available && (
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${down ? "bg-red-500/15 text-red-400" : "bg-emerald-500/15 text-emerald-400"}`}>
                          {q.changePercent}
                        </span>
                      )}
                    </div>

                    {q.available ? (
                      <>
                        <p className="text-2xl font-semibold tabular-nums">{q.price}</p>
                        <p className={`text-xs tabular-nums ${down ? "text-red-400" : "text-emerald-400"}`}>{q.change}</p>
                        <div className="mt-2 flex gap-3 text-[10px] text-white/30">
                          <span>H {q.high}</span>
                          <span>L {q.low}</span>
                          <span>{q.source} · {q.fetchedAt}</span>
                        </div>
                        {read && (
                          <div className="mt-3 border-t border-white/[0.06] pt-3">
                            <p className="text-xs text-white/60">{read.read}</p>
                            {read.position_in_range && (
                              <p className="mt-1 text-[10px] text-blue-400">Range: {read.position_in_range}</p>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="text-lg font-semibold text-white/30">Unavailable</p>
                        <p className="text-[10px] text-white/25">{q.note}</p>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            <Section title="Dollar Context" text={data.dollar_context} />
            <Section title="Gold (XAUUSD)" text={data.gold_context} />
            <Section title="Indices — US30 & NAS100" text={data.indices_context} />

            {data.what_to_watch?.length > 0 && (
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                <h3 className="mb-3 text-sm font-semibold text-white/80">What to Watch</h3>
                <div className="space-y-2">
                  {data.what_to_watch.map((w, i) => (
                    <div key={i} className="flex gap-3 rounded-xl bg-black/30 p-3">
                      <span className="text-sm font-semibold text-blue-400">{i + 1}.</span>
                      <p className="text-sm text-white/70">{w}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-white/[0.04] bg-white/[0.01] p-4">
              <p className="text-center text-xs text-white/20">
                All prices fetched live from Twelve Data at the time shown. Free-tier data may be delayed.
                Nothing here is financial advice.
              </p>
            </div>

          </div>
        )}
      </div>
    </AppShell>
  );
}

function Section({ title, text }: { title: string; text: string }) {
  if (!text) return null;
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
      <h3 className="mb-2 text-sm font-semibold text-white/80">{title}</h3>
      <p className="text-sm text-white/60">{text}</p>
    </div>
  );
}