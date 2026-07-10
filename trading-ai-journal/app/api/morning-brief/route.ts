import { NextResponse } from "next/server";

async function getForexPrices() {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  const prices: Record<string, string> = {};

  const pairs = [
    { from: "EUR", to: "USD", name: "EURUSD" },
    { from: "GBP", to: "USD", name: "GBPUSD" },
    { from: "XAU", to: "USD", name: "XAUUSD" },
  ];

  for (const pair of pairs) {
    try {
      const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${pair.from}&to_currency=${pair.to}&apikey=${apiKey}`;
      const response = await fetch(url, { cache: "no-store" });
      const data = await response.json();
      const rate = data["Realtime Currency Exchange Rate"];
      if (rate) {
        prices[pair.name] = parseFloat(rate["5. Exchange Rate"]).toFixed(
          pair.name === "XAUUSD" ? 2 : 5
        );
      }
    } catch (err) {
      console.error("Price fetch failed:", pair.name);
    }
  }

  return prices;
}

async function getCryptoPrices() {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  const prices: Record<string, string> = {};

  const coins = ["BTC", "ETH"];

  for (const coin of coins) {
    try {
      const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${coin}&to_currency=USD&apikey=${apiKey}`;
      const response = await fetch(url, { cache: "no-store" });
      const data = await response.json();
      const rate = data["Realtime Currency Exchange Rate"];
      if (rate) {
        prices[coin] = parseFloat(rate["5. Exchange Rate"]).toFixed(
          coin === "BTC" ? 0 : 2
        );
      }
    } catch (err) {
      console.error("Crypto price failed:", coin);
    }
  }

  return prices;
}

async function getAllNews() {
  const today = new Date().toISOString().slice(0, 10);
  const allNews: string[] = [];

  const queries = [
    "forex dollar euro fed reserve today",
    "gold price analysis today",
    "bitcoin crypto market today",
    "institutional trading hedge fund today",
    "central bank interest rate today",
  ];

  for (const q of queries) {
    try {
      const response = await fetch(
        `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&from=${today}&sortBy=publishedAt&language=en&apiKey=${process.env.NEWS_API_KEY}&pageSize=3`,
        { cache: "no-store" }
      );
      const data = await response.json();
      if (data.articles) {
        data.articles.forEach((a: any) => {
          allNews.push(`[${a.source.name}] ${a.title}`);
        });
      }
    } catch (err) {
      console.error("News fetch failed");
    }
  }

  return allNews.slice(0, 15).join("\n");
}

async function getEconomicEvents() {
  try {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10);

    const response = await fetch(
      "https://nfs.faireconomy.media/ff_calendar_thisweek.json",
      { cache: "no-store" }
    );

    if (!response.ok) return [];

    const data = await response.json();

    return data
      .filter((event: any) => {
        const eventDate = new Date(event.date).toISOString().slice(0, 10);
        return eventDate === dateStr;
      })
      .map((event: any) => ({
        time: new Date(event.date).toLocaleTimeString("de-AT", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: "Europe/Vienna",
        }),
        currency: event.country,
        event: event.title,
        impact: event.impact || "Low",
        forecast: event.forecast || "N/A",
        previous: event.previous || "N/A",
      }))
      .filter((e: any) => e.impact === "High" || e.impact === "Medium")
      .sort((a: any, b: any) => a.time.localeCompare(b.time));
  } catch (err) {
    console.error("Calendar fetch failed");
    return [];
  }
}

export async function POST() {
  try {
    const now = new Date();
    const today = now.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "Europe/Vienna",
    });

    const euTime = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Europe/Vienna",
    });

    const [forexPrices, cryptoPrices, news, events] = await Promise.all([
      getForexPrices(),
      getCryptoPrices(),
      getAllNews(),
      getEconomicEvents(),
    ]);

    const forexText = Object.entries(forexPrices).length > 0
      ? Object.entries(forexPrices).map(([p, v]) => `${p}: ${v}`).join(" | ")
      : "Prices loading...";

    const cryptoText = Object.entries(cryptoPrices).length > 0
      ? Object.entries(cryptoPrices).map(([c, v]) => `${c}: $${v}`).join(" | ")
      : "Prices loading...";

    const eventsText = events.length > 0
      ? events.map((e: any) => `${e.time} CET - ${e.currency} - ${e.event} (${e.impact}) - F: ${e.forecast} P: ${e.previous}`).join("\n")
      : "No major events today.";

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
            content: `You are an elite Bloomberg Terminal-level market analyst. Today is ${today}, current EU time is ${euTime} CET.
You provide institutional-grade intelligence for forex and crypto traders.
RULES:
- Use ONLY the real prices provided below
- All times must be in CET (Central European Time)
- Give specific price targets calculated from real current prices
- Never use placeholder or example data
- Think like Goldman Sachs, JPMorgan, and Bridgewater combined`,
          },
          {
            role: "user",
            content: `TODAY: ${today} | EU TIME: ${euTime} CET

REAL-TIME FOREX PRICES:
${forexText}

REAL-TIME CRYPTO PRICES:
${cryptoText}

TODAY'S ECONOMIC EVENTS (CET):
${eventsText}

TODAY'S NEWS HEADLINES:
${news || "Use your knowledge of current market conditions as of today."}

Generate a COMPLETE Morning Intelligence Brief. Use REAL prices above for all calculations.

Return ONLY this JSON:
{
  "brief_date": "${today}",
  "brief_time": "${euTime} CET",
  "headline": "One powerful headline for today's markets",
  "market_mood": "Risk-On/Risk-Off/Neutral",
  "summary": "3 sentences covering the most important things happening today with specific prices",
  "key_theme": "The #1 theme driving markets today",

  "forex_analysis": {
    "pairs": [
      {
        "pair": "EURUSD",
        "current_price": "${forexPrices["EURUSD"] || "N/A"}",
        "direction": "Bullish/Bearish",
        "confidence": 65,
        "target": "calculated from current price",
        "stop_loss": "calculated from current price",
        "reason": "Specific reason using real price and today's news",
        "volatility": "Low/Medium/High/Extreme",
        "volatility_score": 65,
        "expected_range": "XX pips",
        "best_time_cet": "09:00-12:00 CET",
        "key_support": "X.XXXX",
        "key_resistance": "X.XXXX"
      },
      {
        "pair": "GBPUSD",
        "current_price": "${forexPrices["GBPUSD"] || "N/A"}",
        "direction": "Bullish/Bearish",
        "confidence": 55,
        "target": "calculated",
        "stop_loss": "calculated",
        "reason": "Real reason",
        "volatility": "Medium",
        "volatility_score": 70,
        "expected_range": "XX pips",
        "best_time_cet": "09:00-12:00 CET",
        "key_support": "X.XXXX",
        "key_resistance": "X.XXXX"
      },
      {
        "pair": "XAUUSD",
        "current_price": "${forexPrices["XAUUSD"] || "N/A"}",
        "direction": "Bullish/Bearish",
        "confidence": 70,
        "target": "calculated",
        "stop_loss": "calculated",
        "reason": "Real reason",
        "volatility": "High",
        "volatility_score": 80,
        "expected_range": "$XX",
        "best_time_cet": "14:00-17:00 CET",
        "key_support": "$XXXX",
        "key_resistance": "$XXXX"
      }
    ],
    "dxy_analysis": "How DXY is affecting all pairs today with specific levels",
    "best_forex_trade": "The single best forex trade today with exact entry, TP, SL prices"
  },

  "crypto_analysis": {
    "sentiment": "Bullish/Bearish/Neutral",
    "fear_greed": "XX - Label",
    "btc_dominance": "XX%",
    "coins": [
      {
        "coin": "BTC",
        "price": "${cryptoPrices["BTC"] || "N/A"}",
        "direction": "Bullish/Bearish",
        "confidence": 65,
        "target": "calculated from real price",
        "move_percent": "+X%",
        "reason": "Real reason based on today's news",
        "category": "Layer1"
      },
      {
        "coin": "ETH",
        "price": "${cryptoPrices["ETH"] || "N/A"}",
        "direction": "Bullish/Bearish",
        "confidence": 60,
        "target": "calculated",
        "move_percent": "+X%",
        "reason": "Real reason",
        "category": "Layer1"
      }
    ],
    "meme_alert": "Any meme coin trending today and why",
    "best_crypto_trade": "Best crypto trade today with entry, target, stop"
  },

  "cot_report": {
    "summary": "What institutions are positioned for this week",
    "positions": [
      { "pair": "EUR/USD", "position": "Net Long +45,000", "signal": "Bullish", "insight": "Why this matters" },
      { "pair": "GOLD", "position": "Net Long +285,000", "signal": "Bullish", "insight": "Why this matters" },
      { "pair": "BTC", "position": "Net Long +15,000", "signal": "Bullish", "insight": "Why this matters" }
    ]
  },

  "correlations": [
    { "assets": "DXY ↔ EURUSD", "value": "-0.92", "meaning": "Specific meaning for today", "action": "What to do" },
    { "assets": "DXY ↔ GOLD", "value": "-0.78", "meaning": "Specific meaning", "action": "What to do" },
    { "assets": "BTC ↔ SP500", "value": "+0.65", "meaning": "Specific meaning", "action": "What to do" }
  ],

  "economic_surprises": [
    { "event": "Recent event", "result": "Beat/Miss", "impact": "How it affects today's trading" }
  ],

  "events_today": [
    { "time": "CET time", "currency": "USD", "event": "Event name", "impact": "High", "forecast": "XX", "previous": "XX", "expected_move": "XX pips on EURUSD" }
  ],

  "best_trades": [
    {
      "rank": 1,
      "asset": "EURUSD",
      "direction": "Buy/Sell",
      "entry": "real price",
      "target": "real target",
      "stop": "real stop",
      "confidence": 72,
      "risk_reward": "1:2.5",
      "timeframe": "Today",
      "reasoning": "Full reasoning with real data"
    },
    {
      "rank": 2,
      "asset": "XAUUSD",
      "direction": "Buy/Sell",
      "entry": "real price",
      "target": "real target",
      "stop": "real stop",
      "confidence": 68,
      "risk_reward": "1:2",
      "timeframe": "24-48h",
      "reasoning": "Full reasoning"
    }
  ],

  "volatility_overview": {
    "overall": "Medium",
    "best_window_cet": "09:00-12:00 CET (London session)",
    "avoid_window_cet": "13:00-14:00 CET (lunch low volatility)",
    "news_warning": "Specific warning about upcoming news volatility"
  },

  "action_items": [
    "Specific thing to do #1",
    "Specific thing to do #2",
    "Specific thing to do #3"
  ]
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

    parsed.real_prices = {
      forex: forexPrices,
      crypto: cryptoPrices,
    };
    parsed.events_raw = events;
    parsed.generated_at = new Date().toISOString();

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Morning brief error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}