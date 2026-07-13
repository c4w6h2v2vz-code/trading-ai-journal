import { NextResponse } from "next/server";

async function getCryptoMarketData() {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h",
      { cache: "no-store" }
    );
    const data = await response.json();
    if (!Array.isArray(data)) return { gainers: [], losers: [], top10: [], btc: null, eth: null };

    const sorted = [...data].sort((a, b) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0));

    const gainers = sorted.slice(0, 8).map((c: any) => ({
      name: c.name, symbol: c.symbol.toUpperCase(), price: c.current_price,
      change_24h: (c.price_change_percentage_24h || 0).toFixed(2),
      volume: c.total_volume, market_cap: c.market_cap,
    }));

    const losers = sorted.slice(-8).reverse().map((c: any) => ({
      name: c.name, symbol: c.symbol.toUpperCase(), price: c.current_price,
      change_24h: (c.price_change_percentage_24h || 0).toFixed(2),
      volume: c.total_volume, market_cap: c.market_cap,
    }));

    const top10 = data.slice(0, 10).map((c: any) => ({
      name: c.name, symbol: c.symbol.toUpperCase(), price: c.current_price,
      change_24h: (c.price_change_percentage_24h || 0).toFixed(2), market_cap: c.market_cap,
    }));

    const btc = data.find((c: any) => c.symbol === "btc");
    const eth = data.find((c: any) => c.symbol === "eth");

    return { gainers, losers, top10, btc, eth };
  } catch (err) {
    console.error("CoinGecko fetch failed:", err);
    return { gainers: [], losers: [], top10: [], btc: null, eth: null };
  }
}

async function getGlobalMarketData() {
  try {
    const response = await fetch("https://api.coingecko.com/api/v3/global", { cache: "no-store" });
    const data = await response.json();
    return {
      total_market_cap: data?.data?.total_market_cap?.usd,
      market_cap_change_24h: data?.data?.market_cap_change_percentage_24h_usd,
      btc_dominance: data?.data?.market_cap_percentage?.btc,
      eth_dominance: data?.data?.market_cap_percentage?.eth,
    };
  } catch {
    return null;
  }
}

async function getCryptoNews() {
  const today = new Date().toISOString().slice(0, 10);
  const allNews: string[] = [];

  const queries = [
    "bitcoin price today",
    "ethereum crypto market today",
    "memecoin pump today",
    "crypto whale alert today",
    "SEC crypto regulation today",
  ];

  for (const q of queries) {
    try {
      const response = await fetch(
        `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&from=${today}&sortBy=publishedAt&language=en&apiKey=${process.env.NEWS_API_KEY}&pageSize=4`,
        { cache: "no-store" }
      );
      const data = await response.json();
      if (data.articles) {
        data.articles.forEach((a: any) => allNews.push(`[Source: ${a.source.name}] ${a.title}`));
      }
    } catch {
      console.error("News fetch failed for:", q);
    }
  }

  return allNews.slice(0, 20).join("\n");
}

export async function POST() {
  try {
    const now = new Date();
    const today = now.toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "Europe/Vienna",
    });

    const [marketData, globalData, news] = await Promise.all([
      getCryptoMarketData(),
      getGlobalMarketData(),
      getCryptoNews(),
    ]);

    const gainersText = marketData.gainers.map((g: any) => `${g.symbol} (${g.name}): $${g.price} (${g.change_24h}%) Vol: $${g.volume}`).join("\n");
    const losersText = marketData.losers.map((l: any) => `${l.symbol} (${l.name}): $${l.price} (${l.change_24h}%) Vol: $${l.volume}`).join("\n");
    const top10Text = marketData.top10.map((t: any) => `${t.symbol}: $${t.price} (${t.change_24h}%)`).join("\n");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an elite crypto market analyst. Today is ${today}. Crypto trades 24/7 including weekends.
CRITICAL RULE: Use ONLY the real prices and data provided — never invent numbers.
CRITICAL RULE: Every claim must cite its source (news headlines are tagged [Source: NAME]). If no news supports a claim, say "based on price/volume data" instead of inventing a source.
CRITICAL RULE: Give realistic probability percentages with an explanation of what specifically drives that probability (volume, momentum, news, or nothing significant).`,
          },
          {
            role: "user",
            content: `Today: ${today}

GLOBAL CRYPTO MARKET:
Total Market Cap: $${globalData?.total_market_cap ? Math.round(globalData.total_market_cap / 1e9) + "B" : "unavailable"}
24h Change: ${globalData?.market_cap_change_24h?.toFixed(2) || "unavailable"}%
BTC Dominance: ${globalData?.btc_dominance?.toFixed(1) || "unavailable"}%
ETH Dominance: ${globalData?.eth_dominance?.toFixed(1) || "unavailable"}%

TOP 10 COINS BY MARKET CAP:
${top10Text || "unavailable"}

TOP GAINERS (24h, REAL DATA):
${gainersText || "unavailable"}

TOP LOSERS (24h, REAL DATA):
${losersText || "unavailable"}

TODAY'S CRYPTO NEWS (with sources):
${news || "No news available today - say so explicitly."}

Analyze this real data and give a comprehensive crypto intelligence report. For each gainer/loser, explain WHY based on volume, momentum, or cited news - do not guess.

Return ONLY this JSON:
{
  "analysis_date": "${today}",
  "market_overview": {
    "sentiment": "Bullish/Bearish/Neutral based on real data",
    "total_market_cap": "real figure from data above",
    "market_cap_change_24h": "real figure",
    "btc_dominance": "real figure",
    "market_trend": "What is actually happening based on real data and cited news"
  },
  "top_coins_to_watch": [
    {
      "coin": "REAL coin symbol from gainers data",
      "price": "real price from data",
      "timeframe": "24-48 hours",
      "direction": "Bullish/Bearish",
      "probability": 65,
      "probability_reason": "Specific reason this probability was chosen - cite volume/momentum/news",
      "potential_gain": "+X% to +X%",
      "potential_loss": "-X%",
      "risk_level": "Low/Medium/High",
      "reason": "Real reason citing source or data",
      "entry": "realistic entry based on current price",
      "target": "realistic target",
      "stop_loss": "realistic stop",
      "category": "Layer1/Meme/DeFi/etc"
    }
  ],
  "meme_coins_alert": [
    { "coin": "real memecoin only if genuinely in gainers/losers data", "reason": "Real reason with source", "buzz_level": "High/Medium/Low", "risk": "High" }
  ],
  "whale_alerts": [
    { "coin": "real coin", "action": "Only include if news source mentions actual whale activity, otherwise omit this array entirely", "impact": "Expected impact" }
  ],
  "coins_to_avoid": [
    { "coin": "real coin from losers data", "reason": "Real reason citing data or news", "risk": "High/Medium" }
  ],
  "rug_pull_warnings": [],
  "best_trade_today": {
    "coin": "Best coin from real data today",
    "entry": "real entry price",
    "target": "real target with % gain",
    "stop_loss": "real stop loss",
    "timeframe": "24-48 hours",
    "reason": "Real detailed reason citing data/news for ${today}"
  },
  "weekly_outlook": "Real weekly outlook based on current real market conditions"
}`,
          }
        ],
      }),
    });

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    const parsed = JSON.parse(jsonMatch[0]);
    parsed.real_market_data = marketData;
    parsed.global_data = globalData;
    parsed.generated_at = new Date().toISOString();

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Crypto intelligence error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}