"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";

type Quote = {
  name: string;
  symbol: string;
  price: string;
  change: string;
  changePercent: string;
  source: string;
  fetchedAt: string;
  available: boolean;
  note?: string;
};

type Coin = {
  name: string;
  symbol: string;
  price: number;
  change24h: string | null;
  marketCap: number;
  volume24h: number;
};

type Meme = {
  name: string;
  symbol: string;
  address: string;
  price: number | null;
  change24h: string | null;
  change1h: string | null;
  liquidity: number | null;
  volume24h: number | null;
  dexUrl: string;
};

type NewsItem = { title: string; url: string; source: string; publishedAt: string | null };

type Brief = {
  headline: string;
  dollar_view: string;
  indices_view: string;
  crypto_view: string;
  crypto_opportunity: string;
  memecoin_view: string;
  news_summary: string;
  what_to_watch: string[];
  risk_warning: string;
  data_note: string;
  quotes: Quote[];
  crypto: Coin[];
  crypto_available: boolean;
  global: { totalMarketCap: number | null; marketCapChange24h: string | null; btcDominance: string | null } | null;
  memecoins: Meme[];
  news: NewsItem[];
  unavailable: string[];
  fetched_at: string;
  sources_used: string[];
};

export default function MorningBriefPage() {
  const [brief, setBrief] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setLoading(true);
    setError("");
    setBrief(null);
    try {
      const res = await fetch("/api/morning-brief", { method: "POST", cache: "no-store" });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setBrief(data);
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
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Morning Brief</h1>
          <p className="mt-1 text-sm text-white/40">
            DXY, US30, NAS100, crypto and trending Solana tokens. Every number is fetched live and labelled with its source.
          </p>
        </div>

        <button onClick={generate} disabled={loading} className="mb-6 w-full rounded-2xl bg-blue-600 py-4 text-base font-semibold transition hover:bg-blue-500 disabled:opacity-40">
          {loading ? "Fetching live market data..." : "Generate Today's Brief"}
        </button>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/[0.07] p-4 text-sm text-red-400">{error}</div>
        )}

        {brief && (
          <div className="space-y-5">

            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-white/40">
                  Fetched {new Date(brief.fetched_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {brief.sources_used.map(s => (
                    <span key={s} className="rounded-full bg-white/[0.06] px-2 py-0.5 text-xs text-white/50">{s}</span>
                  ))}
                </div>
              </div>
              {brief.data_note && <p className="mt-2 text-xs text-white/30">{brief.data_note}</p>}
            </div>

            {brief.unavailable && brief.unavailable.length > 0 && (
              <div className="rounded-2xl border border-orange-500/20 bg-orange-500/[0.06] p-4">
                <p className="mb-1 text-xs font-semibold text-orange-400">Some data could not be fetched</p>
                {brief.unavailable.map((u, i) => (
                  <p key={i} className="text-xs text-orange-300/70">• {u}</p>
                ))}
                <p className="mt-2 text-xs text-white/30">These are shown as unavailable rather than estimated.</p>
              </div>
            )}

            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.06] p-5">
              <h2 className="text-lg font-semibold">{brief.headline}</h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {brief.quotes.map(q => (
                <div key={q.symbol} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-white/35">{q.name}</p>
                  {q.available ? (
                    <div>
                      <p className="mt-1.5 text-2xl font-semibold tabular-nums text-white">{q.price}</p>
                      <p className={`text-xs font-medium tabular-nums ${q.change.startsWith("-") ? "text-red-400" : "text-emerald-400"}`}>
                        {q.change} ({q.changePercent})
                      </p>
                      <p className="mt-1 text-[10px] text-white/25">{q.source} · {q.fetchedAt}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="mt-1.5 text-lg font-semibold text-white/30">Unavailable</p>
                      <p className="mt-1 text-[10px] text-white/25">{q.note}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <Section title="Dollar (DXY)" text={brief.dollar_view} />
            <Section title="Indices — US30 & NAS100" text={brief.indices_view} />

            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white/80">Crypto Market</h3>
                <span className="text-xs text-white/25">CoinGecko</span>
              </div>

              {brief.global && (
                <div className="mb-4 grid grid-cols-3 gap-2">
                  <MiniStat label="Total Mkt Cap" value={brief.global.totalMarketCap ? `$${(brief.global.totalMarketCap / 1e9).toFixed(0)}B` : "—"} />
                  <MiniStat label="24h Change" value={brief.global.marketCapChange24h ? `${brief.global.marketCapChange24h}%` : "—"} tone={Number(brief.global.marketCapChange24h) >= 0 ? "pos" : "neg"} />
                  <MiniStat label="BTC Dominance" value={brief.global.btcDominance ? `${brief.global.btcDominance}%` : "—"} />
                </div>
              )}

              {brief.crypto_available && brief.crypto.length > 0 ? (
                <div className="mb-4 overflow-hidden rounded-xl border border-white/[0.06]">
                  {brief.crypto.map((c, i) => (
                    <div key={c.symbol} className={`flex items-center justify-between px-3 py-2 ${i !== brief.crypto.length - 1 ? "border-b border-white/[0.04]" : ""}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{c.symbol}</span>
                        <span className="text-xs text-white/30">{c.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium tabular-nums">${c.price.toLocaleString("en-US", { maximumFractionDigits: c.price < 1 ? 6 : 2 })}</p>
                        {c.change24h && (
                          <p className={`text-xs tabular-nums ${Number(c.change24h) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {Number(c.change24h) >= 0 ? "+" : ""}{c.change24h}%
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mb-4 text-sm text-white/30">Crypto data unavailable right now.</p>
              )}

              <p className="text-sm text-white/60">{brief.crypto_view}</p>
              {brief.crypto_opportunity && (
                <p className="mt-3 rounded-xl bg-blue-500/[0.08] p-3 text-sm text-blue-300">{brief.crypto_opportunity}</p>
              )}
            </div>

            <div className="rounded-2xl border border-purple-500/20 bg-purple-500/[0.05] p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-purple-300">Trending Solana Tokens</h3>
                <span className="text-xs text-white/25">DexScreener</span>
              </div>

              {brief.memecoins && brief.memecoins.length > 0 ? (
                <div className="mb-4 space-y-2">
                  {brief.memecoins.map(m => (
                    <a key={m.address} href={m.dexUrl} target="_blank" rel="noopener noreferrer" className="block rounded-xl border border-white/[0.06] bg-black/30 p-3 transition hover:border-purple-500/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold">{m.symbol}</p>
                          <p className="text-xs text-white/30">{m.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm tabular-nums">${m.price != null ? m.price.toFixed(m.price < 0.01 ? 8 : 4) : "—"}</p>
                          <div className="flex gap-2 text-xs tabular-nums">
                            {m.change1h && <span className={Number(m.change1h) >= 0 ? "text-emerald-400" : "text-red-400"}>1h {m.change1h}%</span>}
                            {m.change24h && <span className={Number(m.change24h) >= 0 ? "text-emerald-400" : "text-red-400"}>24h {m.change24h}%</span>}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 flex gap-3 text-[10px] text-white/25">
                        <span>Liq ${m.liquidity != null ? m.liquidity.toLocaleString() : "—"}</span>
                        <span>Vol24h ${m.volume24h != null ? m.volume24h.toLocaleString() : "—"}</span>
                        <span className="text-purple-400">View on DexScreener →</span>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="mb-4 text-sm text-white/30">No trending Solana tokens returned right now.</p>
              )}

              <p className="text-sm text-white/60">{brief.memecoin_view}</p>
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <h3 className="mb-3 text-sm font-semibold text-white/80">News</h3>
              {brief.news && brief.news.length > 0 ? (
                <div className="mb-3 space-y-2">
                  {brief.news.map((n, i) => (
                    <a key={i} href={n.url} target="_blank" rel="noopener noreferrer" className="block rounded-xl bg-black/30 p-3 transition hover:bg-black/50">
                      <p className="text-sm text-white/80">{n.title}</p>
                      <p className="mt-1 text-xs text-blue-400">{n.source} — read source →</p>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="mb-3 text-sm text-white/30">No verified news items available right now. Nothing has been invented to fill this space.</p>
              )}
              <p className="text-sm text-white/60">{brief.news_summary}</p>
            </div>

            {brief.what_to_watch && brief.what_to_watch.length > 0 && (
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                <h3 className="mb-3 text-sm font-semibold text-white/80">What to Watch</h3>
                <div className="space-y-2">
                  {brief.what_to_watch.map((w, i) => (
                    <div key={i} className="flex gap-3 rounded-xl bg-black/30 p-3">
                      <span className="text-sm font-semibold text-blue-400">{i + 1}.</span>
                      <p className="text-sm text-white/70">{w}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {brief.risk_warning && (
              <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/[0.06] p-5">
                <h3 className="mb-1 text-xs font-semibold text-yellow-400">Risk Note</h3>
                <p className="text-sm text-white/60">{brief.risk_warning}</p>
              </div>
            )}

            <div className="rounded-2xl border border-white/[0.04] bg-white/[0.01] p-4">
              <p className="text-center text-xs text-white/20">
                All prices fetched live from named sources at the time shown. Free-tier index data may be delayed.
                Nothing here is financial advice. Trending tokens are extremely high risk.
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

function MiniStat({ label, value, tone }: { label: string; value: string; tone?: "pos" | "neg" }) {
  const color = tone === "pos" ? "text-emerald-400" : tone === "neg" ? "text-red-400" : "text-white";
  return (
    <div className="rounded-xl bg-black/30 p-2 text-center">
      <p className="text-[10px] text-white/30">{label}</p>
      <p className={`text-sm font-semibold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}