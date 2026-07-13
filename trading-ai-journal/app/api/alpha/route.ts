import { NextResponse } from "next/server";

async function getSolanaTrending() {
  try {
    const response = await fetch(
      "https://api.dexscreener.com/latest/dex/search?q=solana",
      { cache: "no-store" }
    );
    const data = await response.json();
    if (!data.pairs) return [];

    const solanaPairs = data.pairs
      .filter((p: any) => p.chainId === "solana" && p.liquidity?.usd > 5000)
      .sort((a: any, b: any) => (b.volume?.h24 || 0) - (a.volume?.h24 || 0))
      .slice(0, 30);

    return solanaPairs.map((p: any) => ({
      address: p.baseToken?.address,
      name: p.baseToken?.name,
      symbol: p.baseToken?.symbol,
      price: parseFloat(p.priceUsd || "0"),
      change_24h: p.priceChange?.h24 || 0,
      volume_24h: p.volume?.h24 || 0,
      liquidity: p.liquidity?.usd || 0,
      market_cap: p.marketCap || p.fdv || 0,
      pair_created_at: p.pairCreatedAt,
      dex_url: p.url,
    }));
  } catch (err) {
    console.error("DexScreener fetch failed:", err);
    return [];
  }
}

async function getRugCheck(tokenAddress: string) {
  try {
    const response = await fetch(
      `https://api.rugcheck.xyz/v1/tokens/${tokenAddress}/report/summary`,
      { cache: "no-store" }
    );
    if (!response.ok) return null;
    const data = await response.json();
    return {
      score: data.score,
      risks: (data.risks || []).map((r: any) => r.name),
    };
  } catch {
    return null;
  }
}

async function getSolanaAndBtcContext() {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,solana&vs_currencies=usd&include_24hr_change=true",
      { cache: "no-store" }
    );
    const data = await response.json();
    return {
      btc_price: data?.bitcoin?.usd,
      btc_change_24h: data?.bitcoin?.usd_24h_change,
      sol_price: data?.solana?.usd,
      sol_change_24h: data?.solana?.usd_24h_change,
    };
  } catch {
    return null;
  }
}

async function getCryptoNews() {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=solana+crypto+memecoin&from=${today}&sortBy=publishedAt&language=en&apiKey=${process.env.NEWS_API_KEY}&pageSize=8`,
      { cache: "no-store" }
    );
    const data = await response.json();
    if (data.articles) {
      return data.articles.map((a: any) => `[Source: ${a.source.name}] ${a.title}`).join("\n");
    }
    return "";
  } catch {
    return "";
  }
}

export async function POST() {
  try {
    const today = new Date().toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "Europe/Vienna",
    });

    const [trending, context, news] = await Promise.all([
      getSolanaTrending(),
      getSolanaAndBtcContext(),
      getCryptoNews(),
    ]);

    // Fetch rug check for top 15 tokens only, to respect rate limits
    const topForRiskCheck = trending.slice(0, 15);
    const riskChecks = await Promise.all(
      topForRiskCheck.map((t: any) => t.address ? getRugCheck(t.address) : Promise.resolve(null))
    );

    const enrichedTokens = topForRiskCheck.map((t: any, i: number) => ({
      ...t,
      rug_check: riskChecks[i],
    }));

    const tokensText = enrichedTokens.map((t: any) =>
      `${t.symbol} (${t.name}) | Price: $${t.price} | 24h: ${t.change_24h}% | Volume: $${Math.round(t.volume_24h)} | Liquidity: $${Math.round(t.liquidity)} | MCap: $${Math.round(t.market_cap)} | RugCheck: ${t.rug_check ? `Score ${t.rug_check.score}, Risks: ${t.rug_check.risks.join(", ") || "None flagged"}` : "Not available"}`
    ).join("\n");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an AI research assistant for Solana memecoin day traders, built into PipTrak Alpha.

ABSOLUTE RULES:
- NEVER promise profit. NEVER say a coin "will" pump. Use language like "shows momentum consistent with" or "carries elevated risk of".
- Every score (AI Score, Risk Score) must include a plain-English explanation using the REAL data provided — liquidity, volume, price change, RugCheck flags.
- If RugCheck data is "Not available" for a token, say so explicitly rather than inventing a risk assessment.
- Only use the real token data provided. Never invent tokens, prices, or holder counts.
- This tool is for research only, not a signal service. The user executes trades manually on Axiom.`,
          },
          {
            role: "user",
            content: `Today: ${today}

MARKET CONTEXT:
BTC: $${context?.btc_price} (${context?.btc_change_24h?.toFixed(2)}% 24h)
SOL: $${context?.sol_price} (${context?.sol_change_24h?.toFixed(2)}% 24h)

REAL SOLANA TOKENS (top by volume, with RugCheck data where available):
${tokensText || "No token data available"}

TODAY'S CRYPTO NEWS:
${news || "No specific news available today."}

Analyze this real data and build today's Alpha Brief. Rank tokens by a combination of volume, liquidity health, price momentum, and RugCheck risk score. Explain reasoning transparently using the real numbers given.

Return ONLY this JSON:
{
  "analysis_date": "${today}",
  "market_grade": "A/B/C/D/F - overall quality of setups available today",
  "market_bias": "Risk-On/Risk-Off/Neutral - explain briefly citing BTC/SOL trend",
  "btc_trend": "Bullish/Bearish/Neutral with real price and % cited",
  "sol_trend": "Bullish/Bearish/Neutral with real price and % cited",
  "risk_level": "Low/Medium/High/Extreme - overall memecoin market risk today",
  "ai_market_summary": "3-4 sentences summarizing today's real opportunities and risks, citing specific token symbols and numbers from the data",
  "top_opportunities": [
    {
      "symbol": "REAL symbol from data",
      "name": "REAL name from data",
      "price": "real price",
      "ai_score": 72,
      "risk_score": 45,
      "score_explanation": "Why these scores, citing real liquidity/volume/rugcheck numbers",
      "entry_zone": "realistic zone based on current price",
      "stop_loss": "realistic based on price",
      "take_profit": "realistic based on price",
      "risk_reward": "1:X.X",
      "market_cap": "real mcap from data",
      "liquidity": "real liquidity from data",
      "volume_24h": "real volume from data",
      "reason": "Why this token appears in today's list - cite specific real numbers"
    }
  ],
  "high_risk_opportunities": [
    {
      "symbol": "REAL symbol showing high momentum but high risk",
      "reason": "Why it's high risk but still worth watching, cite RugCheck flags if present"
    }
  ],
  "coins_to_avoid": [
    {
      "symbol": "REAL symbol with poor liquidity or rugcheck flags",
      "reason": "Specific real reason - low liquidity, rugcheck risk flags, or declining volume"
    }
  ],
  "volume_breakouts": [
    { "symbol": "REAL symbol with unusually high volume relative to market cap", "detail": "Real volume/mcap ratio explanation" }
  ],
  "rug_pull_warnings": [
    { "symbol": "REAL symbol only if RugCheck flagged real risks", "warning": "The specific real flags from RugCheck data" }
  ]
}`
          }
        ],
      }),
    });

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");
    const parsed = JSON.parse(jsonMatch[0]);

    parsed.raw_tokens = enrichedTokens;
    parsed.market_context = context;
    parsed.generated_at = new Date().toISOString();

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Alpha brief error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}