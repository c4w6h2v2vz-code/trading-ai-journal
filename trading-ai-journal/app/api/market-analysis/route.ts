import { NextResponse } from "next/server";

async function getForexPrices() {
  try {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    const results: Record<string, string> = {};

    // Only fetch 2 pairs to stay within rate limit
    const pairs = [
      { from: "EUR", to: "USD", name: "EURUSD" },
      { from: "XAU", to: "USD", name: "XAUUSD" },
    ];

    for (const pair of pairs) {
      try {
        const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${pair.from}&to_currency=${pair.to}&apikey=${apiKey}`;
        const response = await fetch(url, { next: { revalidate: 600 } });
        const data = await response.json();
        const rate = data["Realtime Currency Exchange Rate"];
        if (rate) {
          results[pair.name] = parseFloat(rate["5. Exchange Rate"]).toFixed(5);
        }
      } catch {
        console.error(`Failed ${pair.name}`);
      }
    }
    return results;
  } catch {
    return {};
  }
}

async function getNews() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=forex+dollar+euro+gold+fed&from=${today}&sortBy=publishedAt&language=en&apiKey=${process.env.NEWS_API_KEY}&pageSize=10`,
      { next: { revalidate: 3600 } }
    );
    const data = await response.json();
    if (data.articles) {
      return data.articles.map((a: any) => `[${a.source.name}] ${a.title}`).join("\n");
    }
    return "";
  } catch {
    return "";
  }
}

export async function POST(request: Request) {
  try {
    const { events } = await request.json();

    const today = new Date().toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });

    const eventsText = events.length > 0
      ? events.map((e: any) =>
          `${e.time} - ${e.currency} - ${e.event} - Impact: ${e.impact} - Forecast: ${e.forecast} - Previous: ${e.previous}`
        ).join("\n")
      : "No major events today.";

    // Fetch in parallel but limit calls
    const [prices, news] = await Promise.all([
      getForexPrices(),
      getNews(),
    ]);

    const pricesText = Object.entries(prices).length > 0
      ? Object.entries(prices).map(([p, v]) => `${p}: ${v}`).join(" | ")
      : "Prices unavailable";

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an elite institutional market analyst. Today is ${today}. Use real prices and news provided. Never use example data. Give specific price targets.`,
          },
          {
            role: "user",
            content: `Today: ${today}

REAL PRICES: ${pricesText}

ECONOMIC EVENTS: ${eventsText}

TODAY'S NEWS:
${news || "Use your knowledge of current market conditions."}

Provide institutional-level analysis. Think like Goldman Sachs.
Calculate real pip targets from current prices.

Return ONLY this JSON:
{
  "analysis_date": "${today}",
  "market_context": "What is happening in markets today - 2 sentences with real context",
  "smart_money_summary": "What institutions are doing today based on news",
  "dxy_analysis": "How DXY is affecting forex pairs today",
  "institutional_flow": "Where smart money is flowing today",
  "warning": "Key risk for today",
  "best_pairs_to_trade": ["EURUSD", "XAUUSD"],
  "pairs_to_avoid": ["USDJPY"],
  "overall_bias": {
    "EURUSD": { "direction": "Bullish", "confidence": 65, "current_price": "${prices["EURUSD"] || "1.1430"}", "target": "calculate from current price", "reason": "Real reason" },
    "GBPUSD": { "direction": "Bearish", "confidence": 55, "current_price": "1.2700", "target": "calculate", "reason": "Real reason" },
    "XAUUSD": { "direction": "Bullish", "confidence": 70, "current_price": "${prices["XAUUSD"] || "2350"}", "target": "calculate", "reason": "Real reason" },
    "USDJPY": { "direction": "Bearish", "confidence": 60, "current_price": "155.00", "target": "calculate", "reason": "Real reason" }
  },
  "key_levels": {
    "EURUSD": "Support: X.XXXX Resistance: X.XXXX Current: ${prices["EURUSD"] || "1.1430"}",
    "XAUUSD": "Support: $XXXX Resistance: $XXXX Current: ${prices["XAUUSD"] || "2350"}"
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
  "volatility_analysis": {
    "overall_volatility": "Medium",
    "vix_estimate": "18.5 - Normal",
    "best_trading_window": "08:00-11:00 GMT (London open)",
    "avoid_times": "12:00-14:00 GMT (lunch hour low volatility)",
    "pairs_volatility": {
      "EURUSD": { "rating": "Medium", "score": 65, "expected_range": "60-80 pips", "best_time": "08:00-10:00 GMT" },
      "GBPUSD": { "rating": "High", "score": 78, "expected_range": "80-120 pips", "best_time": "08:00-11:00 GMT" },
      "XAUUSD": { "rating": "High", "score": 82, "expected_range": "$15-$25", "best_time": "08:00-12:00 GMT" },
      "USDJPY": { "rating": "Low", "score": 45, "expected_range": "40-60 pips", "best_time": "00:00-03:00 GMT" }
    },
    "news_impact": "FOMC minutes could spike volatility by 150% at 18:00 GMT",
    "recommendation": "Trade during London session, reduce size before FOMC"
  },
  "crypto_analysis": {
    "market_sentiment": "Bullish",
    "fear_greed": "65 - Greed",
    "btc_analysis": "BTC analysis based on today's conditions",
    "best_coins_today": [
      { "coin": "BTC", "current_price": "real BTC price", "direction": "Bullish", "probability": 65, "target": "real target", "move_percent": "+3%", "reason": "Real reason today", "community_buzz": "Current sentiment", "category": "Layer1" }
    ],
    "coins_to_avoid": ["XRP"],
    "meme_coin_alert": "Real meme coin activity today",
    "crypto_trade_plan": "Best crypto trade today with prices"
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
    parsed.generated_at = new Date().toISOString();

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Market analysis error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}