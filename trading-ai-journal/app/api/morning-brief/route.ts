import { NextResponse } from "next/server";

export const maxDuration = 60;
export const dynamic = "force-dynamic";
export const revalidate = 0;

const TD_KEY = process.env.TWELVE_DATA_API_KEY;

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

function nowUTC() {
  return new Date().toISOString().slice(11, 16) + " UTC";
}

// ---------- TWELVE DATA (indices + dollar index) ----------
async function fetchTwelveData(symbol: string, displayName: string): Promise<Quote> {
  const base: Quote = {
    name: displayName,
    symbol,
    price: "Unavailable",
    change: "—",
    changePercent: "—",
    source: "Twelve Data",
    fetchedAt: nowUTC(),
    available: false,
    note: "Data not returned by provider",
  };

  if (!TD_KEY) {
    base.note = "API key not configured";
    return base;
  }

  try {
    const res = await fetch(
      `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbol)}&apikey=${TD_KEY}`,
      { cache: "no-store" }
    );
    const data = await res.json();

    if (!data || data.status === "error" || !data.close) {
      base.note = data?.message ? String(data.message).slice(0, 120) : "No data returned";
      return base;
    }

    return {
      name: displayName,
      symbol,
      price: Number(data.close).toLocaleString("en-US", { maximumFractionDigits: 2 }),
      change: data.change ? Number(data.change).toFixed(2) : "—",
      changePercent: data.percent_change ? Number(data.percent_change).toFixed(2) + "%" : "—",
      source: "Twelve Data",
      fetchedAt: nowUTC(),
      available: true,
    };
  } catch (err) {
    base.note = "Fetch failed";
    return base;
  }
}

// ---------- COINGECKO (crypto) ----------
async function fetchCrypto() {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&price_change_percentage=24h",
      { cache: "no-store" }
    );
    if (!res.ok) return { coins: [], available: false };
    const data = await res.json();
    if (!Array.isArray(data)) return { coins: [], available: false };

    return {
      available: true,
      coins: data.map((c: any) => ({
        name: c.name,
        symbol: String(c.symbol).toUpperCase(),
        price: Number(c.current_price),
        change24h: c.price_change_percentage_24h != null ? Number(c.price_change_percentage_24h).toFixed(2) : null,
        marketCap: c.market_cap,
        volume24h: c.total_volume,
      })),
    };
  } catch {
    return { coins: [], available: false };
  }
}

// ---------- COINGECKO GLOBAL (market sentiment) ----------
async function fetchGlobal() {
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/global", { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    const d = json?.data;
    if (!d) return null;
    return {
      totalMarketCap: d.total_market_cap?.usd ?? null,
      marketCapChange24h: d.market_cap_change_percentage_24h_usd != null
        ? Number(d.market_cap_change_percentage_24h_usd).toFixed(2) : null,
      btcDominance: d.market_cap_percentage?.btc != null
        ? Number(d.market_cap_percentage.btc).toFixed(1) : null,
    };
  } catch {
    return null;
  }
}

// ---------- DEXSCREENER (memecoins) ----------
async function fetchMemecoins() {
  try {
    const res = await fetch("https://api.dexscreener.com/token-boosts/top/v1", { cache: "no-store" });
    if (!res.ok) return [];
    const boosts = await res.json();
    if (!Array.isArray(boosts)) return [];

    const solTokens = boosts.filter((b: any) => b.chainId === "solana").slice(0, 6);
    const results: any[] = [];

    for (const t of solTokens) {
      try {
        const pRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${t.tokenAddress}`, { cache: "no-store" });
        if (!pRes.ok) continue;
        const pData = await pRes.json();
        const pair = pData?.pairs?.[0];
        if (!pair) continue;

        results.push({
          name: pair.baseToken?.name || "Unknown",
          symbol: pair.baseToken?.symbol || "?",
          address: t.tokenAddress,
          price: pair.priceUsd ? Number(pair.priceUsd) : null,
          change24h: pair.priceChange?.h24 != null ? Number(pair.priceChange.h24).toFixed(1) : null,
          change1h: pair.priceChange?.h1 != null ? Number(pair.priceChange.h1).toFixed(1) : null,
          liquidity: pair.liquidity?.usd ? Math.round(pair.liquidity.usd) : null,
          volume24h: pair.volume?.h24 ? Math.round(pair.volume.h24) : null,
          dexUrl: pair.url || `https://dexscreener.com/solana/${t.tokenAddress}`,
        });
      } catch { continue; }
    }
    return results;
  } catch {
    return [];
  }
}

// ---------- NEWS (only items with real URLs) ----------
async function fetchNews() {
  if (!TD_KEY) return [];
  try {
    // CoinGecko has no news API; use Twelve Data market news if available
    const res = await fetch(
      `https://api.twelvedata.com/news?source=all&apikey=${TD_KEY}`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const items = data?.data || data?.news || [];
    if (!Array.isArray(items)) return [];

    return items
      .filter((n: any) => n.url && n.title)
      .slice(0, 6)
      .map((n: any) => ({
        title: n.title,
        url: n.url,
        source: n.source || "Unknown",
        publishedAt: n.datetime || n.published_at || null,
      }));
  } catch {
    return [];
  }
}

export async function POST() {
  try {
    const fetchedAt = new Date().toISOString();

    // Indices + dollar index (Twelve Data)
    const [dxy, us30, nas100] = await Promise.all([
      fetchTwelveData("UUP", "Dollar Index proxy (UUP ETF)"),
      fetchTwelveData("DIA", "US30 proxy (DIA ETF)"),
      fetchTwelveData("QQQ", "NAS100 proxy (QQQ ETF)"),
    ]);

    const [cryptoData, globalData, memecoins, news] = await Promise.all([
      fetchCrypto(),
      fetchGlobal(),
      fetchMemecoins(),
      fetchNews(),
    ]);

    const quotes = [dxy, us30, nas100];
    const unavailable = quotes.filter(q => !q.available).map(q => `${q.name}: ${q.note}`);

    // Build fact sheet for AI — AI may ONLY interpret these, never invent
    const quotesText = quotes.map(q =>
      q.available
        ? `${q.name}: ${q.price} | change ${q.change} (${q.changePercent}) | source ${q.source} at ${q.fetchedAt}`
        : `${q.name}: UNAVAILABLE (${q.note}) — do not guess this value`
    ).join("\n");

    const cryptoText = cryptoData.available && cryptoData.coins.length
      ? cryptoData.coins.map((c: any) =>
          `${c.symbol} (${c.name}): $${c.price} | 24h ${c.change24h ?? "n/a"}% | source CoinGecko`
        ).join("\n")
      : "Crypto data UNAVAILABLE — do not guess prices";

    const globalText = globalData
      ? `Total crypto market cap: $${globalData.totalMarketCap ? (globalData.totalMarketCap / 1e9).toFixed(0) + "B" : "n/a"} | 24h change ${globalData.marketCapChange24h ?? "n/a"}% | BTC dominance ${globalData.btcDominance ?? "n/a"}% | source CoinGecko`
      : "Global crypto stats UNAVAILABLE";

    const memeText = memecoins.length
      ? memecoins.map((m: any) =>
          `${m.symbol} (${m.name}): $${m.price ?? "n/a"} | 1h ${m.change1h ?? "n/a"}% | 24h ${m.change24h ?? "n/a"}% | liquidity $${m.liquidity ?? "n/a"} | vol24h $${m.volume24h ?? "n/a"} | source DexScreener`
        ).join("\n")
      : "No trending Solana tokens returned by DexScreener right now";

    const newsText = news.length
      ? news.map((n: any) => `- ${n.title} (${n.source}) ${n.url}`).join("\n")
      : "No news items with verifiable URLs were returned. Say so plainly — do NOT invent headlines.";

    const factSheet = `
DATA FETCHED AT: ${fetchedAt}

=== INDICES & DOLLAR ===
${quotesText}

=== CRYPTO (top 10 by market cap) ===
${cryptoText}

=== CRYPTO MARKET OVERVIEW ===
${globalText}

=== TRENDING SOLANA TOKENS (high risk) ===
${memeText}

=== NEWS HEADLINES (verified URLs only) ===
${newsText}
`.trim();

    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You write PipTrak's Morning Brief for traders.

ABSOLUTE, NON-NEGOTIABLE RULES:
1. You may ONLY use numbers that appear in the fact sheet given to you. NEVER invent, estimate, round from memory, or recall a price from training data.
2. If something is marked UNAVAILABLE, say "unavailable" — never substitute a guessed value.
3. Never invent a news headline. If no news was provided, say no verified news was available.
4. Always name the source of a number when you cite it (Twelve Data, CoinGecko, DexScreener).
5. Never promise or predict a specific future price. Describe what the data shows, not what will happen.
6. Memecoins are extremely high risk. Always say so.
7. Be concise and practical — a trader reads this in 2 minutes before the session.
8. Do not use the word "guaranteed".`,
          },
          {
            role: "user",
            content: `Here is today's verified market data. Write the Morning Brief using ONLY these numbers.

${factSheet}

Return ONLY this JSON:
{
  "headline": "One sentence on what matters most right now, citing a real number from the fact sheet",
  "dollar_view": "What DXY is doing and what it implies for USD pairs and indices. If unavailable, say so.",
  "indices_view": "What US30 and NAS100 are doing. If unavailable, say so plainly.",
  "crypto_view": "What BTC, ETH and the broader crypto market are doing, citing real numbers and CoinGecko as source",
  "crypto_opportunity": "Where the movement is in crypto today based only on the provided 24h changes. Be honest if it's a quiet day.",
  "memecoin_view": "What the trending Solana tokens show. ALWAYS include a strong risk warning. If none returned, say so.",
  "news_summary": "Summarize only the provided headlines. If none, say no verified news was available today.",
  "what_to_watch": ["2-4 concrete things to watch today, based only on provided data"],
  "risk_warning": "One honest sentence about today's risk conditions based on what the data shows",
  "data_note": "One sentence telling the user this data was fetched at a specific time and free-tier index data may be delayed"
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
      quotes,
      crypto: cryptoData.coins,
      crypto_available: cryptoData.available,
      global: globalData,
      memecoins,
      news,
      unavailable,
      fetched_at: fetchedAt,
      sources_used: ["Twelve Data", "CoinGecko", "DexScreener"],
    });
  } catch (error) {
    console.error("Morning Brief error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}