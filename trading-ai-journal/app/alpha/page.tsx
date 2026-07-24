"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";

type TokenRisk = {
  address: string;
  name: string;
  symbol: string;
  priceUsd: number | null;
  change5m: number | null;
  change1h: number | null;
  change6h: number | null;
  change24h: number | null;
  liquidityUsd: number | null;
  volume24h: number | null;
  volume1h: number | null;
  marketCap: number | null;
  ageHours: number | null;
  buys24h: number | null;
  sells24h: number | null;
  dexUrl: string;
  rugcheckScore: number | null;
  mintAuthority: string | null;
  freezeAuthority: string | null;
  lpLocked: number | null;
  topHolderPercent: number | null;
  rugcheckRisks: { name: string; level: string; description: string }[];
  rugcheckAvailable: boolean;
  redFlags: string[];
  dataNotes: string[];
};

type AlphaData = {
  tokens: TokenRisk[];
  fetched_at: string;
  sources_used: string[];
  disclaimer: string;
};

function fmt(n: number | null, prefix = "$") {
  if (n == null) return "—";
  return prefix + n.toLocaleString("en-US");
}

function pct(n: number | null) {
  if (n == null) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}

export default function AlphaPage() {
  const [data, setData] = useState<AlphaData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  async function scan() {
    setLoading(true);
    setError("");
    setData(null);
    try {
      const res = await fetch("/api/alpha", { method: "POST", cache: "no-store" });
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
        <div className="mb-4">
          <p className="text-xs font-medium uppercase tracking-wider text-purple-400">Intelligence</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Alpha — Risk Scanner</h1>
          <p className="mt-1 text-sm text-white/40">
            Live data on trending Solana tokens with rule-based risk checks. This tool tells you what is dangerous, not what will pump.
          </p>
        </div>

        <div className="mb-5 rounded-2xl border border-yellow-500/20 bg-yellow-500/[0.06] p-4">
          <p className="text-xs text-yellow-300">
            This is not a signal service. Nobody can predict which token will rise — anyone claiming otherwise is guessing.
            What this does is surface real red flags so you can avoid obvious traps.
          </p>
        </div>

        <button onClick={scan} disabled={loading} className="mb-6 w-full rounded-2xl bg-purple-600 py-4 text-base font-semibold transition hover:bg-purple-500 disabled:opacity-40">
          {loading ? "Scanning tokens and running security checks..." : "Scan Trending Solana Tokens"}
        </button>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/[0.07] p-4 text-sm text-red-400">{error}</div>
        )}

        {data && (
          <div className="space-y-4">
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

            <p className="text-xs text-white/30">
              Sorted by fewest red flags first. More flags means more danger, not more opportunity.
            </p>

            {data.tokens.map(t => {
              const flagCount = t.redFlags.length;
              const tone = flagCount === 0 ? "emerald" : flagCount <= 2 ? "yellow" : "red";
              const isOpen = expanded === t.address;

              return (
                <div key={t.address} className={`rounded-2xl border p-5 ${
                  tone === "emerald" ? "border-emerald-500/20 bg-emerald-500/[0.04]" :
                  tone === "yellow" ? "border-yellow-500/20 bg-yellow-500/[0.04]" :
                  "border-red-500/20 bg-red-500/[0.04]"
                }`}>
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">{t.symbol}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          tone === "emerald" ? "bg-emerald-500/15 text-emerald-400" :
                          tone === "yellow" ? "bg-yellow-500/15 text-yellow-400" :
                          "bg-red-500/15 text-red-400"
                        }`}>
                          {flagCount === 0 ? "No red flags found" : `${flagCount} red flag${flagCount === 1 ? "" : "s"}`}
                        </span>
                      </div>
                      <p className="text-xs text-white/30">{t.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold tabular-nums">
                        ${t.priceUsd != null ? t.priceUsd.toFixed(t.priceUsd < 0.01 ? 8 : 4) : "—"}
                      </p>
                      <p className={`text-xs tabular-nums ${(t.change24h ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        24h {pct(t.change24h)}
                      </p>
                    </div>
                  </div>

                  {/* Price movement */}
                  <div className="mb-3 grid grid-cols-4 gap-2">
                    <Cell label="5m" value={pct(t.change5m)} v={t.change5m} />
                    <Cell label="1h" value={pct(t.change1h)} v={t.change1h} />
                    <Cell label="6h" value={pct(t.change6h)} v={t.change6h} />
                    <Cell label="24h" value={pct(t.change24h)} v={t.change24h} />
                  </div>

                  {/* Key facts */}
                  <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <Cell label="Liquidity" value={fmt(t.liquidityUsd)} />
                    <Cell label="Vol 24h" value={fmt(t.volume24h)} />
                    <Cell label="Market cap" value={fmt(t.marketCap)} />
                    <Cell label="Age" value={t.ageHours != null ? `${t.ageHours}h` : "—"} />
                  </div>

                  {/* Red flags — the important part */}
                  {t.redFlags.length > 0 ? (
                    <div className="mb-3 rounded-xl border border-red-500/20 bg-red-500/[0.06] p-3">
                      <p className="mb-2 text-xs font-semibold text-red-400">Red flags</p>
                      <div className="space-y-1.5">
                        {t.redFlags.map((f, i) => (
                          <p key={i} className="text-xs text-red-300/80">• {f}</p>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="mb-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-3">
                      <p className="text-xs text-emerald-300">
                        No automated red flags triggered. This does NOT mean it is safe — it means our specific checks passed.
                      </p>
                    </div>
                  )}

                  {t.dataNotes.length > 0 && (
                    <div className="mb-3 rounded-xl bg-black/30 p-3">
                      {t.dataNotes.map((n, i) => (
                        <p key={i} className="text-xs text-white/40">⚠ {n}</p>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setExpanded(isOpen ? null : t.address)} className="rounded-xl bg-white/[0.06] px-4 py-2 text-xs font-medium text-white/70 hover:bg-white/[0.1]">
                      {isOpen ? "Hide security details" : "Security details"}
                    </button>
                    <a href={t.dexUrl} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-purple-500/15 px-4 py-2 text-xs font-medium text-purple-300 hover:bg-purple-500/25">
                      Open on DexScreener →
                    </a>
                    <a href={`https://rugcheck.xyz/tokens/${t.address}`} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-white/[0.06] px-4 py-2 text-xs font-medium text-white/70 hover:bg-white/[0.1]">
                      Verify on RugCheck →
                    </a>
                  </div>

                  {isOpen && (
                    <div className="mt-3 space-y-2 rounded-xl bg-black/30 p-4">
                      <Row label="RugCheck score" value={t.rugcheckScore != null ? String(t.rugcheckScore) : "Unavailable"} />
                      <Row label="Mint authority" value={t.mintAuthority && t.mintAuthority !== "null" ? "NOT revoked (risk)" : t.rugcheckAvailable ? "Revoked" : "Unavailable"} />
                      <Row label="Freeze authority" value={t.freezeAuthority && t.freezeAuthority !== "null" ? "NOT revoked (risk)" : t.rugcheckAvailable ? "Revoked" : "Unavailable"} />
                      <Row label="LP locked" value={t.lpLocked != null ? `${t.lpLocked.toFixed(0)}%` : "Unavailable"} />
                      <Row label="Top holder" value={t.topHolderPercent != null ? `${t.topHolderPercent.toFixed(1)}% of supply` : "Unavailable"} />
                      <Row label="Buys / Sells 24h" value={`${t.buys24h ?? "—"} / ${t.sells24h ?? "—"}`} />
                      <Row label="Contract" value={t.address.slice(0, 8) + "..." + t.address.slice(-6)} />

                      {t.rugcheckRisks.length > 0 && (
                        <div className="mt-3">
                          <p className="mb-2 text-xs font-semibold text-white/60">RugCheck findings</p>
                          {t.rugcheckRisks.map((r, i) => (
                            <div key={i} className="mb-1.5 rounded-lg bg-black/40 p-2">
                              <p className="text-xs font-medium text-white/70">{r.name} <span className="text-white/30">({r.level})</span></p>
                              {r.description && <p className="text-xs text-white/40">{r.description}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <p className="text-xs leading-relaxed text-white/40">{data.disclaimer}</p>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Cell({ label, value, v }: { label: string; value: string; v?: number | null }) {
  const color = v == null ? "text-white/70" : v >= 0 ? "text-emerald-400" : "text-red-400";
  return (
    <div className="rounded-xl bg-black/30 p-2 text-center">
      <p className="text-[10px] text-white/30">{label}</p>
      <p className={`text-xs font-semibold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/[0.04] py-1.5 last:border-0">
      <span className="text-xs text-white/40">{label}</span>
      <span className="text-xs font-medium text-white/70">{value}</span>
    </div>
  );
}