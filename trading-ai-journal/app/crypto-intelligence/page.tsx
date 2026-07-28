"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";

type Coin = {
  name: string;
  symbol: string;
  price: number;
  change1h: string | null;
  change24h: string | null;
  change7d: string | null;
  marketCap: number;
  volume24h: number;
};

type Mover = { name: string; symbol: string; change24h: string; price: number };
type Trend = { name: string; symbol: string; rank: number | null };

type Data = {
  headline: string;
  market_mood: string;
  btc_eth_view: string;
  where_movement_is: string;
  trending_note: string;
  dominance_note: string;
  what_to_watch: string[];
  risk_note: string;
  data_note: string;
  majors: Coin[];
  topGainers: Mover[];
  topLosers: Mover[];
  trending: Trend[];
  global: { totalMarketCap: number | null; marketCapChange24h: string | null; btcDominance: string | null; ethDominance: string | null } | null;
  fearGreed: { value: number; label: string; source: string } | null;
  fetched_at: string;
  sources_used: string[];
};

function price(n: number) {
  return "$" + n.toLocaleString("en-US", { maximumFractionDigits: n < 1 ? 6 : 2 });
}

export default function CryptoIntelPage() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    setData(null);
    try {
      const res = await fetch("/api/crypto-intelligence", { method: "POST", cache: "no-store" });
      const json = await res.json();
      if (json.error) setError(json.error);
      else setData(json);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  const fgColor = (v: number) =>
    v >= 75 ? "text-emerald-400" : v >= 55 ? "text-emerald-300" : v >= 45 ? "text-yellow-400" : v >= 25 ? "text-orange-400" : "text-red-400";

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <p className="text-xs font-medium uppercase tracking-wider text-blue-400">Intelligence</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Crypto Intel</h1>
          <p className="mt-1 text-sm text-white/40">
            The dedicated crypto desk — majors, movers, sentiment and trending coins. Every number live from CoinGecko, nothing estimated.
          </p>
        </div>

        <button onClick={load} disabled={loading} className="mb-6 w-full rounded-2xl bg-blue-600 py-4 text-base font-semibold transition hover:bg-blue-500 disabled:opacity-40">
          {loading ? "Fetching live crypto data..." : "Load Crypto Intel"}
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
            </div>

            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.06] p-5">
              <p className="text-sm text-white/80">{data.headline}</p>
            </div>

            {/* Sentiment + market */}
            <div className="grid gap-3 sm:grid-cols-2">
              {data.fearGreed && (
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
                  <p className="text-xs font-medium uppercase tracking-wide text-white/35">Fear & Greed</p>
                  <p className={`mt-1 text-3xl font-semibold tabular-nums ${fgColor(data.fearGreed.value)}`}>{data.fearGreed.value}</p>
                  <p className={`text-sm font-medium ${fgColor(data.fearGreed.value)}`}>{data.fearGreed.label}</p>
                  <p className="mt-1 text-[10px] text-white/25">Alternative.me</p>
                </div>
              )}
              {data.global && (
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-white/35">Market</p>
                  <div className="mt-2 space-y-1 text-sm">
                    <div className="flex justify-between"><span className="text-white/40">Total cap</span><span className="tabular-nums">{data.global.totalMarketCap ? `$${(data.global.totalMarketCap / 1e9).toFixed(0)}B` : "—"}</span></div>
                    <div className="flex justify-between"><span className="text-white/40">24h</span><span className={`tabular-nums ${Number(data.global.marketCapChange24h) >= 0 ? "text-emerald-400" : "text-red-400"}`}>{data.global.marketCapChange24h ? `${data.global.marketCapChange24h}%` : "—"}</span></div>
                    <div className="flex justify-between"><span className="text-white/40">BTC dom</span><span className="tabular-nums">{data.global.btcDominance ? `${data.global.btcDominance}%` : "—"}</span></div>
                    <div className="flex justify-between"><span className="text-white/40">ETH dom</span><span className="tabular-nums">{data.global.ethDominance ? `${data.global.ethDominance}%` : "—"}</span></div>
                  </div>
                </div>
              )}
            </div>

            <Section title="Market Mood" text={data.market_mood} />
            <Section title="BTC & ETH" text={data.btc_eth_view} />

            {/* Gainers / Losers */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4">
                <h3 className="mb-2 text-sm font-semibold text-emerald-400">Top Gainers 24h</h3>
                {data.topGainers.map(c => (
                  <div key={c.symbol} className="flex items-center justify-between border-b border-white/[0.04] py-1.5 last:border-0">
                    <span className="text-sm font-medium">{c.symbol}</span>
                    <div className="text-right">
                      <span className="text-xs tabular-nums text-emerald-400">+{c.change24h}%</span>
                      <p className="text-[10px] text-white/30 tabular-nums">{price(c.price)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-4">
                <h3 className="mb-2 text-sm font-semibold text-red-400">Top Losers 24h</h3>
                {data.topLosers.map(c => (
                  <div key={c.symbol} className="flex items-center justify-between border-b border-white/[0.04] py-1.5 last:border-0">
                    <span className="text-sm font-medium">{c.symbol}</span>
                    <div className="text-right">
                      <span className="text-xs tabular-nums text-red-400">{c.change24h}%</span>
                      <p className="text-[10px] text-white/30 tabular-nums">{price(c.price)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Section title="Where the Movement Is" text={data.where_movement_is} />

            {/* Majors table */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white/80">Top 15 by Market Cap</h3>
                <span className="text-xs text-white/25">CoinGecko</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-white/30">
                      <th className="pb-2">Coin</th>
                      <th className="pb-2 text-right">Price</th>
                      <th className="pb-2 text-right">1h</th>
                      <th className="pb-2 text-right">24h</th>
                      <th className="pb-2 text-right">7d</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.majors.map(c => (
                      <tr key={c.symbol} className="border-t border-white/[0.04]">
                        <td className="py-2"><span className="font-semibold">{c.symbol}</span></td>
                        <td className="py-2 text-right tabular-nums">{price(c.price)}</td>
                        <td className={`py-2 text-right tabular-nums text-xs ${Number(c.change1h) >= 0 ? "text-emerald-400" : "text-red-400"}`}>{c.change1h ? `${c.change1h}%` : "—"}</td>
                        <td className={`py-2 text-right tabular-nums text-xs ${Number(c.change24h) >= 0 ? "text-emerald-400" : "text-red-400"}`}>{c.change24h ? `${c.change24h}%` : "—"}</td>
                        <td className={`py-2 text-right tabular-nums text-xs ${Number(c.change7d) >= 0 ? "text-emerald-400" : "text-red-400"}`}>{c.change7d ? `${c.change7d}%` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Trending */}
            {data.trending.length > 0 && (
              <div className="rounded-2xl border border-purple-500/20 bg-purple-500/[0.05] p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-purple-300">Trending (most searched)</h3>
                  <span className="text-xs text-white/25">CoinGecko</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.trending.map(t => (
                    <span key={t.symbol} className="rounded-full bg-black/30 px-3 py-1 text-xs">
                      {t.symbol} <span className="text-white/30">#{t.rank ?? "?"}</span>
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-xs text-white/50">{data.trending_note}</p>
              </div>
            )}

            <Section title="Dominance" text={data.dominance_note} />

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

            {data.risk_note && (
              <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/[0.06] p-5">
                <h3 className="mb-1 text-xs font-semibold text-yellow-400">Risk Note</h3>
                <p className="text-sm text-white/60">{data.risk_note}</p>
              </div>
            )}

            <div className="rounded-2xl border border-white/[0.04] bg-white/[0.01] p-4">
              <p className="text-center text-xs text-white/20">
                All data fetched live from CoinGecko and Alternative.me at the time shown. Nothing here is financial advice. Crypto is highly volatile.
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