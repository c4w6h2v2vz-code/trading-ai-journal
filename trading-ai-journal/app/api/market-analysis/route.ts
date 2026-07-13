import { NextResponse } from "next/server";

async function getGoldPrice() {
  try {
    const response = await fetch("https://data-asg.goldprice.org/dbXRates/USD", { cache: "no-store" });
    const data = await response.json();
    const xauPrice = data?.items?.[0]?.xauPrice;
    if (xauPrice && !isNaN(xauPrice)) {
      return Number(xauPrice).toFixed(2);
    }
    return null;
  } catch (err) {
    console.error("Gold price fetch failed:", err);
    return null;
  }
}

async function getForexPrices() {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  const prices: Record<string, string> = {};

  try {
    const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=EUR&to_currency=USD&apikey=${apiKey}`;
    const response = await fetch(url, { cache: "no-store" });
    const data = await response.json();

    if (data["Note"] || data["Information"]) {
      console.error("Alpha Vantage rate limit hit for EURUSD:", data["Note"] || data["Information"]);
    } else {
      const rate = data["Realtime Currency Exchange Rate"];
      if (rate && rate["5. Exchange Rate"]) {
        const price = parseFloat(rate["5. Exchange Rate"]);
        if (!isNaN(price) && price > 0) {
          prices["EURUSD"] = price.toFixed(5);
        }
      } else {
        console.error("No rate data for EURUSD:", JSON.stringify(data).slice(0, 300));
      }
    }
  } catch (err) {
    console.error("Failed EURUSD:", err);
  }

  const goldPrice = await getGoldPrice();
  if (goldPrice) {
    prices["XAUUSD"] = goldPrice;
  }

  return prices;
}

async function getCryptoTopMovers() {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h",
      { cache: "no-store" }
    );
    const data = await response.json();
    if (!Array.isArray(data)) return { gainers: [], losers: [], btc: null, eth: null };

    const sorted = [...data].sort((a, b) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0));
    const gainers = sorted.slice(0, 5).map((c: any) => ({
      symbol: c.symbol.toUpperCase(), price: c.current_price, change_24h: (c.price_change_percentage_24h || 0).toFixed(2),
    }));
    const losers = sorted.slice(-5).reverse().map((c: any) => ({
      symbol: c.symbol.toUpperCase(), price: c.current_price, change_24h: (c.price_change_percentage_24h || 0).toFixed(2),
    }));
    const btc = data.find((c: any) => c.symbol === "btc");
    const eth = data.find((c: any) => c.symbol === "eth");

    return { gainers, losers, btc, eth };
  } catch {
    return { gainers: [], losers: [], btc: null, eth: null };
  }
}

async function getNews() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=forex+dollar+euro+gold+fed+market&from=${today}&sortBy=publishedAt&language=en&apiKey=${process.env.NEWS_API_KEY}&pageSize=10`,
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

export async function POST(request: Request) {
  try {
    const { events } = await request.json();

    const now = new Date();
    const viennaTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Vienna" }));
    const dayOfWeek = viennaTime.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const today = now.toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "Europe/Vienna",
    });

    const eventsText = events && events.length > 0
      ? events.map((e: any) => `${e.time} - ${e.currency} - ${e.event} - Impact: ${e.impact} - Forecast: ${e.forecast} - Previous: ${e.previous}`).join("\n")
      : "No major events today.";

    const [prices, news, movers] = await Promise.all([
      isWeekend ? Promise.resolve({} as Record<string, string>) : getForexPrices(),
      getNews(),
      getCryptoTopMovers(),
    ]);

    const pricesText = Object.entries(prices).length > 0
      ? Object.entries(prices).map(([p, v]) => `${p}: ${v}`).join(" | ")
      : (isWeekend ? "Forex markets closed (weekend)" : "Forex prices temporarily unavailable");

    const moversText = movers.gainers.length > 0
      ? `BTC: $${movers.btc?.current_price} (${movers.btc?.price_change_percentage_24h?.toFixed(2)}%)\nETH: $${movers.eth?.current_price} (${movers.eth?.price_change_percentage_24h?.toFixed(2)}%)\n\nTop Gainers: ${movers.gainers.map((g: any) => `${g.symbol} ${g.change_24h}%`).join(", ")}\nTop Losers: ${movers.losers.map((l: any) => `${l.symbol} ${l.change_24h}%`).join(", ")}`
      : "Crypto data unavailable";

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an elite institutional market analyst. Today is ${today}. Use ONLY real prices and news provided — never invent data. ${isWeekend ? "Today is WEEKEND - forex is closed, focus on crypto only." : ""}
CRITICAL RULE: Every claim about news or sentiment must cite which source said it (the news headlines are tagged with [Source: NAME]). Do not make vague claims like "market context suggests" — say "According to Reuters..." or "Bloomberg reported...".
CRITICAL RULE: best_pairs_to_trade and pairs_to_avoid must be chosen dynamically based on which pairs actually have the strongest setups today — do not default to the same pairs every time.
CRITICAL RULE: hot_pairs must reflect genuinely which pairs have real volatility today based on the news and events, with realistic pip-range estimates.`,
          },
          {
            role: "user",
            content: `Today: ${today}

${isWeekend ? "WEEKEND - Forex closed. Focus entirely on crypto analysis." : "Forex markets open."}

REAL FOREX PRICES: ${pricesText}

REAL CRYPTO DATA (CoinGecko):
${moversText}

ECONOMIC EVENTS: ${eventsText}

TODAY'S NEWS (with sources):
${news || "No news available - use general knowledge of current market conditions, and say so explicitly rather than inventing a source."}

Provide institutional-level analysis using ONLY real data above. Cite the specific news source for every claim about why price is moving.

Return ONLY this JSON:
{
  "analysis_date": "${today}",
  "is_weekend": ${isWeekend},
  "market_context": "What is happening in markets today - cite specific sources by name",
  "smart_money_summary": "What institutions are doing today, cite sources where possible",
  "dxy_analysis": "${isWeekend ? "Forex markets closed for the weekend." : "How DXY is affecting forex pairs today, cite sources"}",
  "institutional_flow": "Where smart money is flowing today, cite sources",
  "warning": "Key risk for today",
  "hot_pairs": [
    { "pair": "Whichever pair genuinely has the most volatility today", "reason": "Why, citing the news source", "expected_pip_range": "XX-XX pips", "direction": "Bullish/Bearish" }
  ],
  "best_pairs_to_trade": ["Pick 1-2 pairs based on real strength today, do not default"],
  "pairs_to_avoid": ["Pick 1-2 pairs based on real weakness/uncertainty today, do not default"],
  "overall_bias": {
    "EURUSD": { "direction": "Bullish", "confidence": 65, "current_price": "${prices["EURUSD"] || "Price unavailable"}", "target": "calculate from current price", "reason": "Real reason citing source" },
    "XAUUSD": { "direction": "Bullish", "confidence": 70, "current_price": "${prices["XAUUSD"] || "Price unavailable"}", "target": "calculate from current price", "reason": "Real reason citing source" }
  },
  "key_levels": {
    "EURUSD": "Support: X.XXXX Resistance: X.XXXX Current: ${prices["EURUSD"] || "Price unavailable"}",
    "XAUUSD": "Support: $XXXX Resistance: $XXXX Current: ${prices["XAUUSD"] || "Price unavailable"}"
  },
  "volatility_analysis": {
    "overall_volatility": "Low/Medium/High",
    "vix_estimate": "realistic estimate",
    "best_trading_window": "XX:00-XX:00 GMT",
    "avoid_times": "XX:00-XX:00 GMT",
    "pairs_volatility": {
      "EURUSD": { "rating": "Medium", "score": 65, "expected_range": "XX-XX pips", "best_time": "XX:00-XX:00 GMT" },
      "XAUUSD": { "rating": "High", "score": 80, "expected_range": "$XX-$XX", "best_time": "XX:00-XX:00 GMT" }
    },
    "news_impact": "Real news impact today, cite source",
    "recommendation": "Real recommendation"
  },
  "event_analysis": [
    {
      "event": "event name from real events list, or omit this array if no events today",
      "currency": "USD",
      "if_beats": { "direction": "USD Strong", "probability": 65, "avg_pips": 50, "pairs_affected": ["EURUSD down 40-60 pips"] },
      "if_misses": { "direction": "USD Weak", "probability": 60, "avg_pips": 45, "pairs_affected": ["EURUSD up 35-50 pips"] },
      "trade_plan": "Specific trade with real prices",
      "historical_note": "Historical context"
    }
  ],
  "crypto_analysis": {
    "market_sentiment": "Bullish/Bearish/Neutral",
    "fear_greed": "realistic estimate - Label",
    "btc_analysis": "Real BTC analysis using real price and news source if available",
    "best_coins_today": [
      { "coin": "BTC", "current_price": "real price from data", "direction": "Bullish/Bearish", "probability": 65, "target": "real target", "move_percent": "real %", "reason": "Real reason using real gainer/loser data", "community_buzz": "Current sentiment", "category": "Layer1" }
    ],
    "coins_to_avoid": ["real loser coin from data"],
    "meme_coin_alert": "Real meme coin activity if in gainers list, otherwise say none noted today",
    "crypto_trade_plan": "Best crypto trade today with real prices"
  }
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
    parsed.real_prices = prices;
    parsed.top_movers = movers;
    parsed.generated_at = new Date().toISOString();

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Market analysis error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}