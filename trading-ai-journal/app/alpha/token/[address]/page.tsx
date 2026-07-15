"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";

type TokenDetail = {
  symbol: string;
  name: string;
  ai_score: number;
  ai_score_explanation: string;
  risk_score: number;
  risk_score_explanation: string;
  momentum_score: number;
  momentum_explanation: string;
  liquidity_score: number;
  liquidity_explanation: string;
  market_structure: string;
  volume_analysis: string;
  ai_summary: string;
  suggested_entry_zone: string;
  suggested_stop_loss: string;
  suggested_target_1: string;
  suggested_target_2: string;
  invalidates_below: string;
  current_risk: string;
  warnings: string[];
  phase_b_note: string;
  raw_token: any;
  raw_rugcheck: any;
  age_label: string;
  buy_ratio: string;
  vol_to_mcap: string;
  liq_to_mcap: string;
};

export default function AlphaTokenPage() {
  const params = useParams();
  const router = useRouter();
  const address = params?.address as string;

  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<TokenDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!address) return;
    loadToken();
  }, [address]);

  async function loadToken() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/alpha/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const data = await response.json();
      if (data.error) setError(data.error);
      else setDetail(data);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 h-32 animate-pulse" />
          ))}
        </div>
      </div>
    </AppShell>
  );

  if (error) return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <button onClick={() => router.push("/alpha")} className="mb-4 text-sm text-white/40 hover:text-white">← Back to Alpha</button>
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-red-400">{error}</div>
      </div>
    </AppShell>
  );

  if (!detail) return null;

  const t = detail.raw_token;

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <button onClick={() => router.push("/alpha")} className="mb-4 text-sm text-white/40 hover:text-white">← Back to Alpha</button>

        {/* Header */}
        <div className="mb-6 rounded-3xl border border-purple-500/30 bg-purple-500/5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h1 className="text-3xl font-bold">{detail.symbol}</h1>
              <p className="text-sm text-white/40">{detail.name}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">${t.price}</p>
              <p className={`text-sm font-bold ${t.change_24h >= 0 ? "text-green-400" : "text-red-400"}`}>
                {t.change_24h >= 0 ? "+" : ""}{t.change_24h}% (24h)
              </p>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-4">
            <ScoreBadge label="AI Score" value={detail.ai_score} good={detail.ai_score >= 65} />
            <ScoreBadge label="Risk" value={detail.risk_score} good={detail.risk_score <= 40} invert />
            <ScoreBadge label="Momentum" value={detail.momentum_score} good={detail.momentum_score >= 60} />
            <ScoreBadge label="Liquidity" value={detail.liquidity_score} good={detail.liquidity_score >= 60} />
          </div>
        </div>

        {/* Warnings */}
        {detail.warnings?.length > 0 && (
          <div className="mb-6 rounded-3xl border border-red-500/40 bg-red-500/10 p-6">
            <h2 className="mb-3 text-lg font-semibold text-red-400">🚨 Important Warnings</h2>
            <div className="space-y-2">
              {detail.warnings.map((w, i) => (
                <p key={i} className="text-sm text-white/70">• {w}</p>
              ))}
            </div>
          </div>
        )}

        {/* AI Summary */}
        <div className="mb-6 rounded-3xl border border-purple-500/20 bg-purple-500/5 p-6">
          <h2 className="mb-3 text-lg font-semibold text-purple-400">🤖 AI Summary</h2>
          <p className="text-sm text-white/70 leading-relaxed">{detail.ai_summary}</p>
        </div>

        {/* Live Stats */}
        <div className="mb-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="mb-4 text-lg font-semibold">📊 Live Data</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Market Cap" value={`$${Math.round(t.market_cap).toLocaleString()}`} />
            <Stat label="Liquidity" value={`$${Math.round(t.liquidity).toLocaleString()}`} />
            <Stat label="24h Volume" value={`$${Math.round(t.volume_24h).toLocaleString()}`} />
            <Stat label="Pair Age" value={detail.age_label} />
            <Stat label="Buy Ratio 24h" value={`${detail.buy_ratio}%`} />
            <Stat label="Vol/MCap" value={`${detail.vol_to_mcap}%`} />
            <Stat label="1h Change" value={`${t.change_1h}%`} color={t.change_1h >= 0 ? "text-green-400" : "text-red-400"} />
            <Stat label="6h Change" value={`${t.change_6h}%`} color={t.change_6h >= 0 ? "text-green-400" : "text-red-400"} />
            <Stat label="DEX" value={t.dex_id} />
          </div>
        </div>

        {/* Score Explanations */}
        <div className="mb-6 space-y-3">
          <Explain title="AI Score reasoning" text={detail.ai_score_explanation} color="purple" />
          <Explain title="Risk reasoning" text={detail.risk_score_explanation} color="red" />
          <Explain title="Momentum reasoning" text={detail.momentum_explanation} color="green" />
          <Explain title="Liquidity reasoning" text={detail.liquidity_explanation} color="blue" />
        </div>

        {/* Market Structure & Volume */}
        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <h3 className="mb-2 text-sm font-semibold text-white/60">Market Structure</h3>
            <p className="text-xs text-white/60">{detail.market_structure}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <h3 className="mb-2 text-sm font-semibold text-white/60">Volume Analysis</h3>
            <p className="text-xs text-white/60">{detail.volume_analysis}</p>
          </div>
        </div>

        {/* Trade Plan */}
        <div className="mb-6 rounded-3xl border border-green-500/20 bg-green-500/5 p-6">
          <h2 className="mb-4 text-lg font-semibold text-green-400">📋 Suggested Levels</h2>
          <div className="grid gap-2 sm:grid-cols-2 mb-3">
            <Stat label="Entry Zone" value={detail.suggested_entry_zone} />
            <Stat label="Stop Loss" value={detail.suggested_stop_loss} color="text-red-400" />
            <Stat label="Target 1" value={detail.suggested_target_1} color="text-green-400" />
            <Stat label="Target 2" value={detail.suggested_target_2} color="text-green-400" />
          </div>
          <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-3">
            <p className="text-xs text-yellow-400">⚠️ Invalidates below: {detail.invalidates_below}</p>
          </div>
          <p className="mt-3 text-xs text-white/30">Execute manually on Axiom or your preferred DEX. These are research levels, not advice.</p>
        </div>

        {/* RugCheck */}
        <div className="mb-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="mb-3 text-lg font-semibold">🔒 Security (RugCheck)</h2>
          {detail.raw_rugcheck ? (
            <>
              <p className="text-sm text-white/60 mb-3">Score: <span className="font-bold text-white">{detail.raw_rugcheck.score}</span></p>
              {detail.raw_rugcheck.risks?.length > 0 ? (
                <div className="space-y-2">
                  {detail.raw_rugcheck.risks.map((r: any, i: number) => (
                    <div key={i} className="rounded-2xl border border-red-500/20 bg-red-500/5 p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-red-400">{r.name}</p>
                        <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400">{r.level}</span>
                      </div>
                      <p className="text-xs text-white/50">{r.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-white/40">No specific risk flags returned.</p>
              )}
            </>
          ) : (
            <p className="text-sm text-white/40">RugCheck data not available for this token. Verify independently before trading.</p>
          )}
        </div>

        {/* Phase B */}
        <div className="mb-6 rounded-3xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="mb-2 text-sm font-semibold text-white/40">🔜 Coming in Phase B</h2>
          <p className="text-xs text-white/30">{detail.phase_b_note}</p>
        </div>

        {/* Links */}
        {t.dex_url && (
          <a href={t.dex_url} target="_blank" rel="noopener noreferrer" className="block w-full rounded-2xl border border-white/10 bg-white/5 py-3 text-center text-sm font-semibold hover:bg-white/10 transition">
            View on DexScreener →
          </a>
        )}

        <div className="mt-6 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
          <p className="text-xs text-white/20 text-center">
            ⚠️ Research and risk-ranking only, not financial advice. Scores are not profit predictions.
            Always verify independently. Never invest more than you can afford to lose.
          </p>
        </div>
      </div>
    </AppShell>
  );
}

function ScoreBadge({ label, value, good, invert }: { label: string; value: number; good: boolean; invert?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-3 text-center">
      <p className="text-xs text-white/40">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${good ? "text-green-400" : invert ? "text-red-400" : "text-yellow-400"}`}>{value}</p>
      <div className="mt-2 h-1.5 rounded-full bg-white/10">
        <div className={`h-1.5 rounded-full ${good ? "bg-green-500" : invert ? "bg-red-500" : "bg-yellow-500"}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
      <p className="text-xs text-white/40">{label}</p>
      <p className={`text-sm font-semibold mt-1 ${color || "text-white"}`}>{value}</p>
    </div>
  );
}

function Explain({ title, text, color }: { title: string; text: string; color: string }) {
  const colors: Record<string, string> = {
    purple: "border-purple-500/20 bg-purple-500/5 text-purple-400",
    red: "border-red-500/20 bg-red-500/5 text-red-400",
    green: "border-green-500/20 bg-green-500/5 text-green-400",
    blue: "border-blue-500/20 bg-blue-500/5 text-blue-400",
  };
  return (
    <div className={`rounded-2xl border p-4 ${colors[color]}`}>
      <p className="text-xs font-semibold mb-1">{title}</p>
      <p className="text-xs text-white/60">{text}</p>
    </div>
  );
}