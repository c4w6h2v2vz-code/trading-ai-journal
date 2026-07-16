import { NextResponse } from "next/server";

export const maxDuration = 60;

async function getGoldPrice() {
  try {
    const response = await fetch("https://data-asg.goldprice.org/dbXRates/USD", { cache: "no-store" });
    const data = await response.json();
    const xauPrice = data?.items?.[0]?.xauPrice;
    if (xauPrice && !isNaN(xauPrice)) return Number(xauPrice).toFixed(2);
    return null;
  } catch (err) {
    console.error("Gold fetch failed:", err);
    return null;
  }
}

async function getAlphaPair(from: string, to: string) {
  try {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${from}&to_currency=${to}&apikey=${apiKey}`;
    const response = await fetch(url, { cache: "no-store" });
    const data = await response.json();

    if (data["Note"] || data["Information"]) {
      console.error(`Alpha Vantage limit hit for ${from}${to}`);
      return null;
    }

    const rate = data["Realtime Currency Exchange Rate"];
    if (rate && rate["5. Exchange Rate"]) {
      const price = parseFloat(rate["5. Exchange Rate"]);
      if (!isNaN(price) && price > 0) return price;
    }
    console.error(`No rate for ${from}${to}:`, JSON.stringify(data).slice(0, 200));
    return null;
  } catch (err) {
    console.error(`Fetch failed ${from}${to}:`, err);
    return null;
  }
}

async function getForexPrices() {
  const prices: Record<string, string> = {};

  const eurusd = await getAlphaPair("EUR", "USD");
  await new Promise(r => setTimeout(r, 13000));
  const gbpusd = await getAlphaPair("GBP", "USD");
  await new Promise(r => setTimeout(r, 13000));
  const usdjpy = await getAlphaPair("USD", "JPY");

  if (eurusd) prices["EURUSD"] = eurusd.toFixed(5);
  if (gbpusd) prices["GBPUSD"] = gbpusd.toFixed(5);
  if (usdjpy) prices["USDJPY"] = usdjpy.toFixed(3);

  if (gbpusd && usdjpy) prices["GBPJPY"] = (gbpusd * usdjpy).toFixed(3);
  if (eurusd && usdjpy) prices["EURJPY"] = (eurusd * usdjpy).toFixed(3);
  if (eurusd && gbpusd) prices["EURGBP"] = (eurusd / gbpusd).toFixed(5);

  const gold = await getGoldPrice();
  if (gold) prices["XAUUSD"] = gold;

  return prices;
}

async function getCryptoData() {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h",
      { cache: "no-store" }
    );
    const data = await response.json();
    if (!Array.isArray(data)) return { btc: null, eth: null, gainers: [], losers: [] };

    const sorted = [...data].sort(
      (a, b) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0)
    );

    const gainers = sorted.slice(0, 5).map((c: any) => ({
      symbol: c.symbol.toUpperCase(),
      price: c.current_price,
      change_24h: Number(c.price_change_percentage_24h || 0).toFixed(2),
      volume: c.total_volume,
    }));

    const losers = sorted.slice(-5).reverse().map((c: any) => ({
      symbol: c.symbol.toUpperCase(),
      price: c.current_price,
      change_24h: Number(c.price_change_percentage_24h || 0).toFixed(2),
      volume: c.total_volume,
    }));

    const btcCoin = data.find((c: any) => c.symbol === "btc");
    const ethCoin = data.find((c: any) => c.symbol === "eth");

    const btc = btcCoin ? { price: btcCoin.current_price, change_24h: Number(btcCoin.price_change_percentage_24h || 0).toFixed(2) } : null;
    const eth = ethCoin ? { price: ethCoin.current_price, change_24h: Number(ethCoin.price_change_percentage_24h || 0).toFixed(2) } : null;

    return { btc, eth, gainers, losers };
  } catch (err) {
    console.error("CoinGecko failed:", err);
    return { btc: null, eth: null, gainers: [], losers: [] };
  }
}

async function getGlobalCrypto() {
  try {
    const response = await fetch("https://api.coingecko.com/api/v3/global", { cache: "no-store" });
    const data = await response.json();
    return {
      btc_dominance: data?.data?.market_cap_percentage?.btc?.toFixed(1) ?? null,
      market_cap_change_24h: data?.data?.market_cap_change_percentage_24h_usd?.toFixed(2) ?? null,
    };
  } catch {
    return { btc_dominance: null, market_cap_change_24h: null };
  }
}

async function getNews() {
  const today = new Date().toISOString().slice(0, 10);
  const items: { source: string; title: string; url: string }[] = [];
  const queries = ["federal reserve dollar", "forex market today", "gold price today", "bitcoin crypto today"];

  for (const q of queries) {
    try {
      const response = await fetch(
        `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&from=${today}&sortBy=publishedAt&language=en&apiKey=${process.env.NEWS_API_KEY}&pageSize=4`,
        { cache: "no-store" }
      );
      const data = await response.json();
      if (data.articles) {
        data.articles.forEach((a: any) => items.push({ source: a.source.name, title: a.title, url: a.url }));
      }
    } catch {
      console.error("News failed:", q);
    }
  }
  return items.slice(0, 14);
}

async function getEvents() {
  try {
    const response = await fetch("https://nfs.faireconomy.media/ff_calendar_thisweek.json", { cache: "no-store" });
    const data = await response.json();
    if (!Array.isArray(data)) return [];

    const today = new Date().toISOString().slice(0, 10);

    return data
      .filter((e: any) => String(e.date).slice(0, 10) === today)
      .filter((e: any) => e.impact === "High" || e.impact === "Medium")
      .map((e: any) => ({
        title: e.title,
        country: e.country,
        date: e.date,
        impact: e.impact,
        forecast: e.forecast || "n/a",
        previous: e.previous || "n/a",
      }))
      .slice(0, 8);
  } catch (err) {
    console.error("Calendar failed:", err);
    return [];
  }
}

export async function POST() {
  try {
    const now = new Date();
    const viennaTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Vienna" }));
    const dayOfWeek = viennaTime.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const today = now.toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "Europe/Vienna",
    });
    const euTime = now.toLocaleTimeString("en-US", {
      hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Europe/Vienna",
    });

    const [prices, crypto, global, news, events] = await Promise.all([
      isWeekend ? Promise.resolve({} as Record<string, string>) : getForexPrices(),
      getCryptoData(),
      getGlobalCrypto(),
      getNews(),
      isWeekend ? Promise.resolve([]) : getEvents(),
    ]);

    const allPairs = ["EURUSD", "GBPUSD", "USDJPY", "GBPJPY", "EURJPY", "EURGBP", "XAUUSD"];
    const availablePairs = allPairs.filter(p => prices[p]);
    const missingPairs = isWeekend ? [] : allPairs.filter(p => !prices[p]);

    const pricesText = availablePairs.length > 0
      ? availablePairs.map(p => `${p}: ${prices[p]}`).join(" | ")
      : (isWeekend ? "Forex closed (weekend)" : "No forex prices available");

    const cryptoText = crypto.btc
      ? `BTC: $${crypto.btc.price} (${crypto.btc.change_24h}% 24h)
ETH: ${crypto.eth ? `$${crypto.eth.price} (${crypto.eth.change_24h}% 24h)` : "unavailable"}
BTC Dominance: ${global.btc_dominance ?? "unavailable"}%
Total market cap 24h change: ${global.market_cap_change_24h ?? "unavailable"}%

TOP GAINERS: ${crypto.gainers.map((g: any) => `${g.symbol} $${g.price} (${g.change_24h}%)`).join(", ")}
TOP LOSERS: ${crypto.losers.map((l: any) => `${l.symbol} $${l.price} (${l.change_24h}%)`).join(", ")}`
      : "Crypto data unavailable";

    const newsText = news.length > 0
      ? news.map(n => `[Source: ${n.source}] ${n.title}`).join("\n")
      : "No news retrieved today.";

    const eventsText = events.length > 0
      ? events.map((e: any) => `${e.country} | ${e.title} | Impact: ${e.impact} | Forecast: ${e.forecast} | Previous: ${e.previous}`).join("\n")
      : "No major economic events scheduled today.";

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an institutional market analyst inside PipTrak. Today is ${today}, ${euTime} CET. All times must be CET.

ABSOLUTE RULES — breaking these is a critical failure:
1. NEVER invent a price. Use ONLY the exact live prices provided.
2. Output one entry in "pairs" for EACH pair that HAS a live price. For those, you MUST calculate real target, stop_loss, support and resistance FROM that live price.
3. Do NOT include any pair that has no live price. Mention missing pairs only in "warnings".
4. For crypto, use ONLY the real CoinGecko prices and movers provided. Never invent a coin or a price.
5. Every claim about WHY markets are moving must cite a source by name from the news list. If nothing supports it, write "based on price action only".
6. Historical context is a TENDENCY, never a prediction. Never say a market WILL move.
7. Never invent statistics, percentages of past outcomes, or COT numbers you do not have. For COT, give only directional reasoning based on general knowledge and say it is not live data.
${isWeekend ? "8. TODAY IS WEEKEND — forex is closed. Give no forex setups. Focus entirely on crypto." : ""}`,
          },
          {
            role: "user",
            content: `Today: ${today} at ${euTime} CET
${isWeekend ? "WEEKEND — forex closed, crypto trades 24/7." : "Forex markets open."}

REAL LIVE FOREX PRICES (the ONLY forex prices you may use):
${pricesText}
${missingPairs.length > 0 ? `\nNO LIVE PRICE TODAY (exclude from "pairs", mention in warnings): ${missingPairs.join(", ")}` : ""}

REAL LIVE CRYPTO DATA (CoinGecko):
${cryptoText}

TODAY'S ECONOMIC EVENTS:
${eventsText}

TODAY'S NEWS (real sources):
${newsText}

Produce today's Morning Brief. Return ONLY this JSON:
{
  "brief_date": "${today}",
  "brief_time": "${euTime} CET",
  "is_weekend": ${isWeekend},
  "headline": "One sharp sentence on what matters most today, citing a real source if available",
  "market_mood": "Risk-On" or "Risk-Off" or "Neutral",
  "summary": "3-4 sentences on today's picture across forex and crypto. Cite sources by name.",
  "key_theme": "The single dominant market driver today",
  "usd_bias": {
    "direction": "Bullish USD / Bearish USD / Neutral",
    "reasoning": "Why, citing real sources or price action",
    "confidence_note": "Plain-English statement of how clear this read is. Never a fake percentage."
  },
  "hot_pairs": [
    { "pair": "Whichever available pair genuinely has most volatility today", "reason": "Why, citing source or price action", "expected_move": "realistic pip range", "direction": "Bullish/Bearish" }
  ],
  "pairs": [
    {
      "pair": "pair name",
      "current_price": "the exact real price provided",
      "direction": "Bullish/Bearish/Neutral",
      "confidence": 65,
      "reason": "Why, citing source or price action",
      "target": "level calculated from the REAL price",
      "stop_loss": "level calculated from the REAL price",
      "key_support": "from the REAL price",
      "key_resistance": "from the REAL price",
      "volatility": "Low/Medium/High",
      "expected_range": "realistic pip range",
      "best_time_cet": "e.g. 09:00-11:00 CET"
    }
  ],
  "crypto_analysis": {
    "sentiment": "Bullish/Bearish/Neutral based on the real data",
    "btc_dominance": "${global.btc_dominance ?? "unavailable"}",
    "btc_analysis": "Real BTC read using the real price and change provided",
    "top_gainers": [
      { "symbol": "real symbol from data", "price": "real price", "change_24h": "real number WITHOUT a percent sign", "continue_probability": 60, "reason": "Why, based on real volume/momentum or cited news", "trade_plan": "Concrete plan using real numbers" }
    ],
    "top_losers": [
      { "symbol": "real symbol from data", "price": "real price", "change_24h": "real number WITHOUT a percent sign", "bounce_probability": 40, "reason": "Why, based on real data" }
    ],
    "best_crypto_trade": "Best crypto idea today using only real prices"
  },
  "cot_report": {
    "summary": "Directional read on institutional positioning based on general knowledge. State plainly this is not live COT data.",
    "positions": [
      { "pair": "an available pair", "signal": "Bullish/Bearish", "insight": "Reasoning, clearly framed as general context not live data" }
    ]
  },
  "correlations": [
    { "assets": "e.g. XAUUSD vs DXY", "relationship": "Inverse/Positive", "meaning": "What it implies today", "action": "What to do with that" }
  ],
  "events_today": [
    {
      "time": "CET time if known, else 'Time TBC'",
      "currency": "real currency from the event data",
      "event": "real event name from the list only",
      "impact": "High/Medium",
      "forecast": "real forecast from data",
      "previous": "real previous from data",
      "expected_move": "realistic pip range on affected pairs",
      "bias_direction": "Bullish USD / Bearish USD / Mixed",
      "bias_strength": "Strong tendency / Moderate tendency / Weak-Mixed",
      "historical_note": "How this TYPE of event has generally tended to move markets. Say plainly it is a tendency, not a guarantee. If you lack reliable knowledge, say so.",
      "if_beats_forecast": "General tendency if it beats forecast",
      "if_misses_forecast": "General tendency if it misses forecast"
    }
  ],
  "best_setup": {
    "asset": "Best asset today from those WITH real prices. If none, write 'None - no live prices available' and set other fields to 'Unavailable'.",
    "direction": "Buy/Sell",
    "entry": "from the real price",
    "target": "from the real price",
    "stop": "from the real price",
    "risk_reward": "1:X",
    "confidence": 65,
    "reasoning": "Why this setup, citing source or price action",
    "invalidation": "What would kill this idea"
  },
  "volatility_overview": {
    "overall": "Low/Medium/High",
    "hottest_asset": "which available asset is moving most",
    "best_window_cet": "e.g. 09:00-11:00 CET",
    "avoid_window_cet": "e.g. 12:00-13:30 CET",
    "news_warning": "Any timing risk from today's events"
  },
  "warnings": ["Real risks today. Include a warning naming any pair whose price was unavailable."],
  "action_items": ["3-4 concrete things to do today"]
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

    parsed.real_prices = prices;
    parsed.missing_pairs = missingPairs;
    parsed.news_items = news;
    parsed.raw_events = events;
    parsed.raw_crypto = crypto;
    parsed.generated_at = new Date().toISOString();

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Morning brief error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}