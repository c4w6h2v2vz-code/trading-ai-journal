import { NextResponse } from "next/server";

async function getForexPrices() {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  const prices: Record<string, string> = {};

  const pairs = [
    { from: "EUR", to: "USD", name: "EURUSD" },
    { from: "XAU", to: "USD", name: "XAUUSD" },
  ];

  for (const pair of pairs) {
    try {
      const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${pair.from}&to_currency=${pair.to}&apikey=${apiKey}`;
      const response = await fetch(url, { cache: "no-store" });
      const data = await response.json();

      if (data["Note"] || data["Information"]) {
        console.error(`Alpha Vantage rate limit hit for ${pair.name}:`, data["Note"] || data["Information"]);
        continue;
      }

      const rate = data["Realtime Currency Exchange Rate"];
      if (rate && rate["5. Exchange Rate"]) {
        const price = parseFloat(rate["5. Exchange Rate"]);
        if (!isNaN(price) && price > 0) {
          prices[pair.name] = pair.name === "XAUUSD" ? price.toFixed(2) : price.toFixed(5);
        }
      } else {
        console.error(`No rate data for ${pair.name}:`, JSON.stringify(data).slice(0, 300));
      }

      await new Promise(resolve => setTimeout(resolve, 1200));
    } catch (err) {
      console.error(`Failed ${pair.name}:`, err);
    }
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
    if (data.articles) return data.articles.map((a: any) => `[${a.source.name}] ${a.title}`).join("\n");
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
      : "Forex markets closed (weekend)";

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
            content: `You are an elite institutional market analyst. Today is ${today}. Use ONLY real prices and news provided. Never use example data. Give specific price targets. ${isWeekend ? "Today is WEEKEND - forex is closed, focus on crypto only." : ""}`,
          },
          {
            role: "user",
            content: `Today: ${today}

${isWeekend ? "WEEKEND - Forex closed. Focus entirely on crypto analysis." : "Forex markets open."}

REAL FOREX PRICES: ${pricesText}

REAL CRYPTO DATA (CoinGecko):
${moversText}

ECONOMIC EVENTS: ${eventsText}

TODAY'S NEWS:
${news || "Use your knowledge of current market conditions."}

Provide institutional-level analysis using ONLY real data above.

Return ONLY this JSON:
{
  "analysis_date": "${today}",
  "is_weekend": ${isWeekend},
  "market_context": "What is happening in markets today - 2 sentences with real context",
  "smart_money_summary": "What institutions are doing today based on news",
  "dxy_analysis": "${isWeekend ? "Forex markets closed for the weekend." : "How DXY is affecting forex pairs today"}",
  "institutional_flow": "Where smart money is flowing today",
  "warning": "Key risk for today",
  "best_pairs_to_trade": ${isWeekend ? '["BTC", "ETH"]' : '["EURUSD", "XAUUSD"]'},
  "pairs_to_avoid": ["USDJPY"],
  "overall_bias": {
    "EURUSD": { "direction": "Bullish", "confidence": 65, "current_price": "${prices["EURUSD"] || "Price unavailable"}", "target": "calculate", "reason": "Real reason" },
    "XAUUSD": { "direction": "Bullish", "confidence": 70, "current_price": "${prices["XAUUSD"] || "Price unavailable"}", "target": "calculate", "reason": "Real reason" }
  },
  "key_levels": {
    "EURUSD": "Support: X.XXXX Resistance: X.XXXX Current: ${prices["EURUSD"] || "Price unavailable"}",
    "XAUUSD": "Support: $XXXX Resistance: $XXXX Current: ${prices["XAUUSD"] || "Price unavailable"}"
  },
  "volatility_analysis": {
    "overall_volatility": "Medium",
    "vix_estimate": "18.5 - Normal",
    "best_trading_window": "08:00-11:00 GMT",
    "avoid_times": "12:00-14:00 GMT",
    "pairs_volatility": {
      "EURUSD": { "rating": "Medium", "score": 65, "expected_range": "60-80 pips", "best_time": "08:00-10:00 GMT" },
      "XAUUSD": { "rating": "High", "score": 80, "expected_range": "$15-25", "best_time": "08:00-12:00 GMT" }
    },
    "news_impact": "Real news impact today",
    "recommendation": "Real recommendation"
  },
  "event_analysis": [
    {
      "event": "event name",
      "currency": "USD",
      "if_beats": { "direction": "USD Strong", "probability": 65, "avg_pips": 50, "pairs_affected": ["EURUSD down 40-60 pips"] },
      "if_misses": { "direction": "USD Weak", "probability": 60, "avg_pips": 45, "pairs_affected": ["EURUSD up 35-50 pips"] },
      "trade_plan": "Specific trade with real prices",
      "historical_note": "Historical context"
    }
  ],
  "crypto_analysis": {
    "market_sentiment": "Bullish",
    "fear_greed": "65 - Greed",
    "btc_analysis": "Real BTC analysis using real price",
    "best_coins_today": [
      { "coin": "BTC", "current_price": "real price from data", "direction": "Bullish", "probability": 65, "target": "real target", "move_percent": "real %", "reason": "Real reason using real gainer/loser data", "community_buzz": "Current sentiment", "category": "Layer1" }
    ],
    "coins_to_avoid": ["real loser coin"],
    "meme_coin_alert": "Real meme coin activity if in gainers list",
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