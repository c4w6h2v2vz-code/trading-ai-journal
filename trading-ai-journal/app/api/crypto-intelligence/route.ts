import { NextResponse } from "next/server";

export const maxDuration = 60;
export const dynamic = "force-dynamic";
export const revalidate = 0;

async function fetchMarkets() {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&price_change_percentage=1h,24h,7d",
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function fetchGlobal() {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/global", { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  } catch {
    return null;
  }
}

async function fetchTrending() {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/search/trending", { cache: "no-store" });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json?.coins) ? json.coins.slice(0, 7) : [];
  } catch {
    return [];
  }
}

async function fetchFearGreed() {
  try {
    const res = await fetch("https://api.alternative.me/fng/?limit=1", { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    const d = json?.data?.[0];
    if (!d) return null;
    return { value: Number(d.value), label: d.value_classification, source: "Alternative.me" };
  } catch {
    return null;
  }
}

export async function POST() {
  try {
    const fetchedAt = new Date().toISOString();

    const [markets, global, trending, fearGreed] = await Promise.all([
      fetchMarkets(),
      fetchGlobal(),
      fetchTrending(),
      fetchFearGreed(),
    ]);

    if (markets.length === 0) {
      return NextResponse.json({ error: "CoinGecko unavailable right now. Try again shortly." }, { status: 503 });
    }

    const majors = markets.slice(0, 15).map((c: any) => ({
      name: c.name,
      symbol: String(c.symbol).toUpperCase(),
      price: Number(c.current_price),
      change1h: c.price_change_percentage_1h_in_currency != null ? Number(c.price_change_percentage_1h_in_currency).toFixed(2) : null,
      change24h: c.price_change_percentage_24h != null ? Number(c.price_change_percentage_24h).toFixed(2) : null,
      change7d: c.price_change_percentage_7d_in_currency != null ? Number(c.price_change_percentage_7d_in_currency).toFixed(2) : null,
      marketCap: c.market_cap,
      volume24h: c.total_volume,
    }));

    const sorted24h = [...markets].filter((c: any) => c.price_change_percentage_24h != null);
    const topGainers = [...sorted24h]
      .sort((a: any, b: any) => b.price_change_percentage_24h - a.price_change_percentage_24h)
      .slice(0, 5)
      .map((c: any) => ({ name: c.name, symbol: String(c.symbol).toUpperCase(), change24h: Number(c.price_change_percentage_24h).toFixed(1), price: Number(c.current_price) }));
    const topLosers = [...sorted24h]
      .sort((a: any, b: any) => a.price_change_percentage_24h - b.price_change_percentage_24h)
      .slice(0, 5)
      .map((c: any) => ({ name: c.name, symbol: String(c.symbol).toUpperCase(), change24h: Number(c.price_change_percentage_24h).toFixed(1), price: Number(c.current_price) }));

    const trendingCoins = trending.map((t: any) => ({
      name: t.item?.name,
      symbol: String(t.item?.symbol || "").toUpperCase(),
      rank: t.item?.market_cap_rank ?? null,
    }));

    const globalStats = global ? {
      totalMarketCap: global.total_market_cap?.usd ?? null,
      marketCapChange24h: global.market_cap_change_percentage_24h_usd != null ? Number(global.market_cap_change_percentage_24h_usd).toFixed(2) : null,
      btcDominance: global.market_cap_percentage?.btc != null ? Number(global.market_cap_percentage.btc).toFixed(1) : null,
      ethDominance: global.market_cap_percentage?.eth != null ? Number(global.market_cap_percentage.eth).toFixed(1) : null,
    } : null;

    // Build fact sheet
    const majorsText = majors.map((c: any) =>
      `${c.symbol} (${c.name}): $${c.price} | 1h ${c.change1h ?? "n/a"}% | 24h ${c.change24h ?? "n/a"}% | 7d ${c.change7d ?? "n/a"}%`
    ).join("\n");

    const gainersText = topGainers.map((c: any) => `${c.symbol}: +${c.change24h}% ($${c.price})`).join("\n");
    const losersText = topLosers.map((c: any) => `${c.symbol}: ${c.change24h}% ($${c.price})`).join("\n");
    const trendingText = trendingCoins.map((c: any) => `${c.symbol} (${c.name}) rank ${c.rank ?? "n/a"}`).join("\n");
    const fgText = fearGreed ? `${fearGreed.value}/100 — ${fearGreed.label} (source Alternative.me)` : "unavailable";
    const globalText = globalStats
      ? `Total market cap $${globalStats.totalMarketCap ? (globalStats.totalMarketCap / 1e9).toFixed(0) + "B" : "n/a"} | 24h ${globalStats.marketCapChange24h ?? "n/a"}% | BTC dominance ${globalStats.btcDominance ?? "n/a"}% | ETH dominance ${globalStats.ethDominance ?? "n/a"}%`
      : "unavailable";

    const factSheet = `
DATA FETCHED AT: ${fetchedAt} (source: CoinGecko, Alternative.me)

FEAR & GREED INDEX: ${fgText}

MARKET OVERVIEW: ${globalText}

TOP 15 BY MARKET CAP:
${majorsText}

TOP 5 GAINERS (24h):
${gainersText}

TOP 5 LOSERS (24h):
${losersText}

TRENDING (most searched):
${trendingText}
`.trim();

    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are PipTrak's crypto desk analyst.

ABSOLUTE RULES:
1. Use ONLY numbers from the fact sheet. Never invent, estimate, or recall a price.
2. If something is unavailable, say so — never guess.
3. Never predict a specific future price. Describe what the data shows now.
4. Always cite sources (CoinGecko, Alternative.me).
5. Trending/searched coins are often more speculative — note that.
6. Be practical and concise for a trader.
7. Never say "guaranteed" or give advice framed as certainty.`,
          },
          {
            role: "user",
            content: `Today's verified crypto data:

${factSheet}

Return ONLY this JSON:
{
  "headline": "One sentence on the crypto market right now, citing a real number",
  "market_mood": "What the Fear & Greed index and market cap change suggest about sentiment today, citing the real values",
  "btc_eth_view": "What BTC and ETH are specifically doing today using their real 1h/24h/7d numbers",
  "where_movement_is": "Where today's real movement is based on the gainers/losers, citing numbers. Be honest if it's a quiet day.",
  "trending_note": "Comment on the trending/most-searched coins, noting they are often more speculative",
  "dominance_note": "What BTC/ETH dominance implies today, if available",
  "what_to_watch": ["2-4 concrete things to watch based only on the provided data"],
  "risk_note": "One honest sentence on today's crypto risk conditions",
  "data_note": "One sentence on fetch time and sources"
}`
          }
        ],
      }),
    });

    const aiData = await aiRes.json();
    const text = aiData.choices?.[0]?.message?.content || "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("AI returned no JSON");
    const parsed = JSON.parse(match[0]);

    return NextResponse.json({
      ...parsed,
      majors,
      topGainers,
      topLosers,
      trending: trendingCoins,
      global: globalStats,
      fearGreed,
      fetched_at: fetchedAt,
      sources_used: ["CoinGecko", "Alternative.me"],
    });
  } catch (error) {
    console.error("Crypto Intel error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}