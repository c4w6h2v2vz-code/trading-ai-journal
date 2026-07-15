import { NextResponse } from "next/server";

async function getTokenPairs(address: string) {
  try {
    const response = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${address}`,
      { cache: "no-store" }
    );
    const data = await response.json();
    if (!data.pairs || data.pairs.length === 0) return null;

    const solanaPairs = data.pairs.filter((p: any) => p.chainId === "solana");
    if (solanaPairs.length === 0) return null;

    const best = [...solanaPairs].sort(
      (a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
    )[0];

    return {
      address: best.baseToken?.address,
      name: best.baseToken?.name,
      symbol: best.baseToken?.symbol,
      price: parseFloat(best.priceUsd || "0"),
      change_5m: best.priceChange?.m5 || 0,
      change_1h: best.priceChange?.h1 || 0,
      change_6h: best.priceChange?.h6 || 0,
      change_24h: best.priceChange?.h24 || 0,
      volume_24h: best.volume?.h24 || 0,
      volume_6h: best.volume?.h6 || 0,
      volume_1h: best.volume?.h1 || 0,
      liquidity: best.liquidity?.usd || 0,
      market_cap: best.marketCap || best.fdv || 0,
      fdv: best.fdv || 0,
      pair_created_at: best.pairCreatedAt,
      dex_id: best.dexId,
      dex_url: best.url,
      txns_24h_buys: best.txns?.h24?.buys || 0,
      txns_24h_sells: best.txns?.h24?.sells || 0,
      txns_1h_buys: best.txns?.h1?.buys || 0,
      txns_1h_sells: best.txns?.h1?.sells || 0,
      total_pairs: solanaPairs.length,
    };
  } catch (err) {
    console.error("DexScreener token fetch failed:", err);
    return null;
  }
}

async function getRugCheckFull(address: string) {
  try {
    const response = await fetch(
      `https://api.rugcheck.xyz/v1/tokens/${address}/report/summary`,
      { cache: "no-store" }
    );
    if (!response.ok) return null;
    const data = await response.json();
    return {
      score: data.score,
      score_normalised: data.score_normalised,
      risks: (data.risks || []).map((r: any) => ({
        name: r.name,
        description: r.description,
        level: r.level,
        score: r.score,
      })),
    };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const { address } = await request.json();

    if (!address) {
      return NextResponse.json({ error: "Token address required" }, { status: 400 });
    }

    const today = new Date().toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "Europe/Vienna",
    });

    const [token, rugCheck] = await Promise.all([
      getTokenPairs(address),
      getRugCheckFull(address),
    ]);

    if (!token) {
      return NextResponse.json({ error: "Token not found on Solana DEXs" }, { status: 404 });
    }

    const ageMs = token.pair_created_at ? Date.now() - token.pair_created_at : null;
    const ageHours = ageMs ? Math.floor(ageMs / (1000 * 60 * 60)) : null;
    const ageLabel = ageHours === null ? "unknown" :
      ageHours < 24 ? `${ageHours} hours` :
      `${Math.floor(ageHours / 24)} days`;

    const buyRatio = token.txns_24h_buys + token.txns_24h_sells > 0
      ? ((token.txns_24h_buys / (token.txns_24h_buys + token.txns_24h_sells)) * 100).toFixed(1)
      : "unknown";

    const volToMcap = token.market_cap > 0
      ? ((token.volume_24h / token.market_cap) * 100).toFixed(1)
      : "unknown";

    const liqToMcap = token.market_cap > 0
      ? ((token.liquidity / token.market_cap) * 100).toFixed(1)
      : "unknown";

    const rugText = rugCheck
      ? `RugCheck score: ${rugCheck.score} (normalised: ${rugCheck.score_normalised ?? "n/a"})
Flags: ${rugCheck.risks.length > 0 ? rugCheck.risks.map((r: any) => `${r.name} (${r.level}) - ${r.description}`).join("; ") : "None flagged"}`
      : "RugCheck data not available for this token";

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an AI research assistant for Solana memecoin traders, built into PipTrak Alpha.

ABSOLUTE RULES:
- NEVER promise profit. NEVER say a token "will" pump. Use "shows momentum consistent with" or "carries elevated risk of".
- Every score MUST include a plain-English explanation citing the REAL numbers given (liquidity, volume, buy/sell ratio, RugCheck flags, age).
- If RugCheck data is unavailable, state that explicitly — never invent a risk assessment.
- Never invent holder counts, wallet activity, or developer behavior — that data is NOT provided. If asked about it, say it requires Phase B data.
- This is research only. The user executes manually on Axiom.
- If the data looks genuinely bad (very low liquidity, severe rug flags), say so bluntly. Do not soften real risk.`,
          },
          {
            role: "user",
            content: `Today: ${today}

REAL TOKEN DATA (DexScreener):
Symbol: ${token.symbol}
Name: ${token.name}
Price: $${token.price}
Price change 5m: ${token.change_5m}%
Price change 1h: ${token.change_1h}%
Price change 6h: ${token.change_6h}%
Price change 24h: ${token.change_24h}%
Volume 24h: $${Math.round(token.volume_24h)}
Volume 6h: $${Math.round(token.volume_6h)}
Volume 1h: $${Math.round(token.volume_1h)}
Liquidity: $${Math.round(token.liquidity)}
Market Cap: $${Math.round(token.market_cap)}
FDV: $${Math.round(token.fdv)}
Pair age: ${ageLabel}
DEX: ${token.dex_id}
Buys (24h): ${token.txns_24h_buys}
Sells (24h): ${token.txns_24h_sells}
Buy ratio (24h): ${buyRatio}%
Buys (1h): ${token.txns_1h_buys}
Sells (1h): ${token.txns_1h_sells}
Volume/MarketCap ratio: ${volToMcap}%
Liquidity/MarketCap ratio: ${liqToMcap}%
Number of trading pairs: ${token.total_pairs}

REAL SECURITY DATA:
${rugText}

Analyze this specific token honestly using ONLY the real data above.

Return ONLY this JSON:
{
  "symbol": "${token.symbol}",
  "name": "${token.name}",
  "ai_score": 0-100 integer,
  "ai_score_explanation": "Why this score, citing the real numbers",
  "risk_score": 0-100 integer where higher = more risky,
  "risk_score_explanation": "Why this risk score, citing real RugCheck flags and liquidity numbers",
  "momentum_score": 0-100 integer,
  "momentum_explanation": "Based on real 1h/6h/24h price changes and volume trend",
  "liquidity_score": 0-100 integer,
  "liquidity_explanation": "Based on real liquidity number and liquidity/mcap ratio - explain what this means for slippage and exit risk",
  "market_structure": "What the real buy/sell ratio and volume pattern suggests about who is trading this",
  "volume_analysis": "Analysis of real volume trend across 1h/6h/24h and vol/mcap ratio",
  "ai_summary": "3-4 sentence honest summary of this token right now, citing real numbers. If it looks bad, say so plainly.",
  "suggested_entry_zone": "Realistic zone based on current price, or 'Not advisable' if data is too risky",
  "suggested_stop_loss": "Realistic level, or 'Not advisable'",
  "suggested_target_1": "Realistic level, or 'Not advisable'",
  "suggested_target_2": "Realistic level, or 'Not advisable'",
  "invalidates_below": "Price level where the setup no longer makes sense",
  "current_risk": "Low/Medium/High/Extreme",
  "warnings": ["Specific real warnings from the actual data - rug flags, low liquidity, extreme age, etc. Empty array only if genuinely nothing concerning."],
  "phase_b_note": "Holder growth, whale activity, smart wallet tracking and developer wallet behavior require premium on-chain data — coming in Phase B."
}`
          }
        ],
      }),
    });

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in AI response");
    const parsed = JSON.parse(jsonMatch[0]);

    parsed.raw_token = token;
    parsed.raw_rugcheck = rugCheck;
    parsed.age_label = ageLabel;
    parsed.buy_ratio = buyRatio;
    parsed.vol_to_mcap = volToMcap;
    parsed.liq_to_mcap = liqToMcap;
    parsed.generated_at = new Date().toISOString();

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Alpha token detail error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}