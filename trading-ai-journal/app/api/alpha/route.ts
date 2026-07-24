import { NextResponse } from "next/server";

export const maxDuration = 60;
export const dynamic = "force-dynamic";
export const revalidate = 0;

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
  // Risk facts (from RugCheck)
  rugcheckScore: number | null;
  mintAuthority: string | null;
  freezeAuthority: string | null;
  lpLocked: number | null;
  topHolderPercent: number | null;
  rugcheckRisks: { name: string; level: string; description: string }[];
  rugcheckAvailable: boolean;
  // Derived warnings — all rule-based, no prediction
  redFlags: string[];
  dataNotes: string[];
  momentum?: {
    volumeAcceleration: string | null;
    volumeAccelerationNote: string;
    buyPressure: string | null;
    buyPressureNote: string;
    liquidityRatio: string | null;
    liquidityRatioNote: string;
    trendAlignment: string;
    whatWouldHaveToHold: string[];
  };
};

function hoursSince(ms: number | null | undefined) {
  if (!ms) return null;
  return Math.round((Date.now() - ms) / 3600000);
}

async function fetchRugcheck(address: string) {
  try {
    const res = await fetch(`https://api.rugcheck.xyz/v1/tokens/${address}/report`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
type Momentum = {
  volumeAcceleration: string | null;
  volumeAccelerationNote: string;
  buyPressure: string | null;
  buyPressureNote: string;
  liquidityRatio: string | null;
  liquidityRatioNote: string;
  trendAlignment: string;
  whatWouldHaveToHold: string[];
};

function buildMomentum(t: Partial<TokenRisk>): Momentum {
  const m: Momentum = {
    volumeAcceleration: null,
    volumeAccelerationNote: "Not enough volume data returned to compare periods.",
    buyPressure: null,
    buyPressureNote: "Buy/sell counts not available.",
    liquidityRatio: null,
    liquidityRatioNote: "Liquidity or volume missing.",
    trendAlignment: "Not enough timeframe data.",
    whatWouldHaveToHold: [],
  };

  // Volume acceleration: 1h volume vs the average hourly volume across 24h
  if (t.volume1h != null && t.volume24h != null && t.volume24h > 0) {
    const avgHourly = t.volume24h / 24;
    if (avgHourly > 0) {
      const accel = t.volume1h / avgHourly;
      m.volumeAcceleration = accel.toFixed(1) + "x";
      m.volumeAccelerationNote =
        accel > 3
          ? `Last hour's volume is ${accel.toFixed(1)}x the 24h hourly average — activity is spiking right now. This describes what is happening, not what happens next.`
          : accel < 0.4
          ? `Last hour's volume is only ${accel.toFixed(1)}x the 24h average — interest is cooling off.`
          : `Last hour's volume is ${accel.toFixed(1)}x the 24h average — activity is roughly steady.`;
    }
  }

  // Buy pressure
  if (t.buys24h != null && t.sells24h != null && (t.buys24h + t.sells24h) > 0) {
    const total = t.buys24h + t.sells24h;
    const buyShare = (t.buys24h / total) * 100;
    m.buyPressure = buyShare.toFixed(0) + "% buys";
    m.buyPressureNote =
      buyShare > 60
        ? `${buyShare.toFixed(0)}% of transactions were buys (${t.buys24h} buys vs ${t.sells24h} sells) — more wallets entering than exiting over 24h.`
        : buyShare < 40
        ? `Only ${buyShare.toFixed(0)}% were buys (${t.buys24h} buys vs ${t.sells24h} sells) — distribution, holders are leaving.`
        : `Buys and sells are roughly balanced (${t.buys24h} buys vs ${t.sells24h} sells).`;
  }

  // Liquidity vs volume — exit feasibility
  if (t.liquidityUsd != null && t.volume24h != null && t.liquidityUsd > 0) {
    const ratio = t.volume24h / t.liquidityUsd;
    m.liquidityRatio = ratio.toFixed(1) + "x";
    m.liquidityRatioNote =
      ratio > 20
        ? `24h volume is ${ratio.toFixed(0)}x the pool size. A position of any size will move the price against you on exit.`
        : ratio > 5
        ? `24h volume is ${ratio.toFixed(1)}x the pool. Exiting a large position would cause noticeable slippage.`
        : `24h volume is ${ratio.toFixed(1)}x the pool — relatively normal turnover for this liquidity.`;
  }

  // Trend alignment across timeframes (fact, not forecast)
  const tf = [
    { label: "5m", v: t.change5m },
    { label: "1h", v: t.change1h },
    { label: "6h", v: t.change6h },
    { label: "24h", v: t.change24h },
  ].filter(x => x.v != null) as { label: string; v: number }[];

  if (tf.length >= 3) {
    const allUp = tf.every(x => x.v > 0);
    const allDown = tf.every(x => x.v < 0);
    if (allUp) m.trendAlignment = `All measured timeframes (${tf.map(x => x.label).join(", ")}) are positive. Note: sustained vertical moves in new tokens frequently reverse hard.`;
    else if (allDown) m.trendAlignment = `All measured timeframes (${tf.map(x => x.label).join(", ")}) are negative — consistent selling.`;
    else {
      const shortTerm = t.change1h ?? 0;
      const longTerm = t.change24h ?? 0;
      m.trendAlignment =
        shortTerm > 0 && longTerm < 0
          ? "Short-term bounce inside a 24h downtrend — this is often a dead-cat bounce in new tokens."
          : shortTerm < 0 && longTerm > 0
          ? "Pulling back after a 24h gain — could be profit taking, cannot be known in advance."
          : "Mixed signals across timeframes.";
    }
  }

  // What would have to hold — conditions, not predictions
  if (t.liquidityUsd != null) {
    m.whatWouldHaveToHold.push(`Liquidity must stay above $${Math.round(t.liquidityUsd).toLocaleString()} — if it drops sharply, the pool is being pulled.`);
  }
  if (t.buys24h != null && t.sells24h != null) {
    m.whatWouldHaveToHold.push("Buy count must keep pace with sells — flipping to majority sells means distribution.");
  }
  if (t.topHolderPercent != null && t.topHolderPercent > 10) {
    m.whatWouldHaveToHold.push(`Top holder (${t.topHolderPercent.toFixed(1)}%) must not sell — watch that wallet on-chain.`);
  }
  m.whatWouldHaveToHold.push("None of these are predictions. They are conditions you can check yourself in real time.");

  return m;
}
function buildRedFlags(t: Partial<TokenRisk>): string[] {
  const flags: string[] = [];

  // Liquidity vs volume — thin liquidity with heavy volume means you may not be able to exit
  if (t.liquidityUsd != null && t.volume24h != null && t.liquidityUsd > 0) {
    const ratio = t.volume24h / t.liquidityUsd;
    if (ratio > 20) flags.push(`Volume is ${ratio.toFixed(0)}x liquidity — exiting a position may move the price against you badly`);
  }

  if (t.liquidityUsd != null && t.liquidityUsd < 10000) {
    flags.push(`Liquidity only $${Math.round(t.liquidityUsd).toLocaleString()} — very thin, high slippage risk`);
  }

  if (t.mintAuthority && t.mintAuthority !== "null" && t.mintAuthority !== "") {
    flags.push("Mint authority is NOT revoked — the creator can mint unlimited new tokens");
  }

  if (t.freezeAuthority && t.freezeAuthority !== "null" && t.freezeAuthority !== "") {
    flags.push("Freeze authority is NOT revoked — the creator can freeze your wallet's tokens");
  }

  if (t.topHolderPercent != null && t.topHolderPercent > 20) {
    flags.push(`Top holder owns ${t.topHolderPercent.toFixed(1)}% of supply — a single sell could crash the price`);
  }

  if (t.lpLocked != null && t.lpLocked < 50) {
    flags.push(`Only ${t.lpLocked.toFixed(0)}% of liquidity is locked — the rest can be pulled at any time`);
  }

  if (t.ageHours != null && t.ageHours < 24) {
    flags.push(`Token is only ${t.ageHours}h old — no track record, highest rug risk window`);
  }

  if (t.buys24h != null && t.sells24h != null && t.sells24h > 0) {
    const ratio = t.buys24h / t.sells24h;
    if (ratio < 0.7) flags.push(`More sells than buys (${t.buys24h} buys vs ${t.sells24h} sells) — holders are exiting`);
  }

  if (t.change24h != null && t.change24h < -50) {
    flags.push(`Down ${Math.abs(t.change24h).toFixed(0)}% in 24h — may already have rugged or be dumping`);
  }

  return flags;
}

async function buildToken(boost: any): Promise<TokenRisk | null> {
  try {
    const address = boost.tokenAddress;
    const pRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`, { cache: "no-store" });
    if (!pRes.ok) return null;
    const pData = await pRes.json();
    const pair = pData?.pairs?.[0];
    if (!pair) return null;

    const rug = await fetchRugcheck(address);

    const topHolderPercent = rug?.topHolders?.[0]?.pct != null ? Number(rug.topHolders[0].pct) : null;
    const lpLocked = rug?.markets?.[0]?.lp?.lpLockedPct != null ? Number(rug.markets[0].lp.lpLockedPct) : null;

    const dataNotes: string[] = [];
    if (!rug) dataNotes.push("RugCheck data unavailable for this token — security checks could not be verified");

    const base: Partial<TokenRisk> = {
      address,
      name: pair.baseToken?.name || "Unknown",
      symbol: pair.baseToken?.symbol || "?",
      priceUsd: pair.priceUsd ? Number(pair.priceUsd) : null,
      change5m: pair.priceChange?.m5 != null ? Number(pair.priceChange.m5) : null,
      change1h: pair.priceChange?.h1 != null ? Number(pair.priceChange.h1) : null,
      change6h: pair.priceChange?.h6 != null ? Number(pair.priceChange.h6) : null,
      change24h: pair.priceChange?.h24 != null ? Number(pair.priceChange.h24) : null,
      liquidityUsd: pair.liquidity?.usd ? Math.round(pair.liquidity.usd) : null,
      volume24h: pair.volume?.h24 ? Math.round(pair.volume.h24) : null,
      volume1h: pair.volume?.h1 ? Math.round(pair.volume.h1) : null,
      marketCap: pair.marketCap ? Math.round(pair.marketCap) : null,
      ageHours: hoursSince(pair.pairCreatedAt),
      buys24h: pair.txns?.h24?.buys ?? null,
      sells24h: pair.txns?.h24?.sells ?? null,
      dexUrl: pair.url || `https://dexscreener.com/solana/${address}`,
      rugcheckScore: rug?.score != null ? Number(rug.score) : null,
      mintAuthority: rug?.token?.mintAuthority ?? null,
      freezeAuthority: rug?.token?.freezeAuthority ?? null,
      lpLocked,
      topHolderPercent,
      rugcheckRisks: Array.isArray(rug?.risks)
        ? rug.risks.map((r: any) => ({ name: r.name, level: r.level, description: r.description }))
        : [],
      rugcheckAvailable: !!rug,
      dataNotes,
    };

    base.redFlags = buildRedFlags(base);
    (base as any).momentum = buildMomentum(base);

    return base as TokenRisk;
  } catch {
    return null;
  }
}

export async function POST() {
  try {
    const fetchedAt = new Date().toISOString();

    const boostRes = await fetch("https://api.dexscreener.com/token-boosts/top/v1", { cache: "no-store" });
    if (!boostRes.ok) {
      return NextResponse.json({ error: "DexScreener unavailable right now. Try again shortly." }, { status: 503 });
    }
    const boosts = await boostRes.json();
    if (!Array.isArray(boosts)) {
      return NextResponse.json({ error: "DexScreener returned unexpected data." }, { status: 503 });
    }

    const solTokens = boosts.filter((b: any) => b.chainId === "solana").slice(0, 8);

    const tokens: TokenRisk[] = [];
    for (const b of solTokens) {
      const t = await buildToken(b);
      if (t) tokens.push(t);
    }

    if (tokens.length === 0) {
      return NextResponse.json({ error: "No Solana tokens could be loaded right now." }, { status: 503 });
    }

    // Sort: safest-looking first (fewest red flags), so danger is obvious
    tokens.sort((a, b) => a.redFlags.length - b.redFlags.length);

    return NextResponse.json({
      tokens,
      fetched_at: fetchedAt,
      sources_used: ["DexScreener", "RugCheck"],
      disclaimer:
        "This is a risk scanner, not a signal service. Nothing here predicts which tokens will rise. Every number is fetched live from DexScreener and RugCheck. Red flags are rule-based checks on real data. Most new tokens lose money. Never invest more than you can afford to lose completely.",
    });
  } catch (error) {
    console.error("Alpha error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}