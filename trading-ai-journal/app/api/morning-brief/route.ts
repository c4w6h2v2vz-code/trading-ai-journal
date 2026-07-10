import { NextResponse } from "next/server";

async function getForexPrices() {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  const prices: Record<string, string> = {};

  const pairs = [
    { from: "EUR", to: "USD", name: "EURUSD" },
    { from: "GBP", to: "USD", name: "GBPUSD" },
    { from: "USD", to: "JPY", name: "USDJPY" },
    { from: "XAU", to: "USD", name: "XAUUSD" },
    { from: "AUD", to: "USD", name: "AUDUSD" },
  ];

  for (const pair of pairs) {
    try {
      const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${pair.from}&to_currency=${pair.to}&apikey=${apiKey}`;
      const response = await fetch(url, { cache: "no-store" });
      const data = await response.json();
      const rate = data["Realtime Currency Exchange Rate"];
      if (rate) {
        const price = parseFloat(rate["5. Exchange Rate"]);
        if (pair.name === "XAUUSD") {
          prices[pair.name] = price.toFixed(2);
        } else if (pair.name === "USDJPY") {
          prices[pair.name] = price.toFixed(3);
        } else {
          prices[pair.name] = price.toFixed(5);
        }
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
        prices[coin] = parseFloat(rate["5. Exchange Rate"]).toFixed(coin === "BTC" ? 0 : 2);
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
    "forex EURUSD GBPUSD USDJPY market today",
    "gold XAUUSD price analysis today",
    "bitcoin crypto market today",
    "federal reserve interest rate inflation",
    "ECB BOE BOJ central bank policy",
    "forex factory economic calendar impact",
    "institutional trading hedge fund positioning",
    "DXY dollar index trend today",
    "GBPJPY AUDUSD forex volatility",
    "oil prices geopolitical risk today",
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

  return allNews.slice(0, 20).join("\n");
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
    const now = new Date(); const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
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
      isWeekend ? Promise.resolve({} as Record<string, string>) : getForexPrices(),
      getCryptoPrices(),
      getAllNews(),
      isWeekend ? Promise.resolve([] as any[]) : getEconomicEvents(),
    ]);

    const forexText = Object.entries(forexPrices).length > 0
      ? Object.entries(forexPrices).map(([p, v]) => `${p}: ${v}`).join("\n")
      : "Prices loading...";

    const cryptoText = Object.entries(cryptoPrices).length > 0
      ? Object.entries(cryptoPrices).map(([c, v]) => `${c}: $${v}`).join("\n")
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
            content: `You are an elite Bloomberg Terminal-level market analyst. Today is ${today}, EU time is ${euTime} CET.
RULES:
- Use ONLY the real prices provided — never invent prices
- All times in CET (Central European Time)
- Calculate specific targets from real current prices
- Never use placeholder data
- Analyze ALL pairs provided including cross pairs like GBPJPY
- Identify which pairs have the HIGHEST volatility today
- Think like Goldman Sachs and JPMorgan combined
- Include real support/resistance levels based on current prices`,
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

TODAY'S NEWS FROM REUTERS, BLOOMBERG, FOREXFACTORY:
${news || "Use your knowledge of current market conditions."}

${isWeekend 
  ? "TODAY IS WEEKEND - Forex markets are CLOSED. Focus ONLY on crypto analysis since crypto trades 24/7. For forex, give a preview of what to expect on Monday. Do NOT give forex trade signals for today." 
  : "Generate a COMPLETE Morning Intelligence Brief for today's live markets."}
Use REAL prices above for ALL calculations.
Include ALL pairs: EURUSD, GBPUSD, USDJPY, XAUUSD, AUDUSD.
Also analyze cross pairs: GBPJPY, EURJPY, EURGBP.
Identify the HOTTEST pairs with most volatility today.

Return ONLY this JSON:
{
  "brief_date": "${today}",
  "brief_time": "${euTime} CET",
  "headline": "One powerful headline for today's markets based on real news",
  "market_mood": "Risk-On/Risk-Off/Neutral",
  "summary": "3 sentences with real prices and real news context",
  "key_theme": "The #1 theme driving markets today",

  "hot_pairs": [
    {
      "pair": "The pair with highest volatility today",
      "reason": "Why this pair is hot today",
      "expected_move": "XX pips",
      "direction": "Bullish/Bearish"
    }
  ],

  "forex_analysis": {
    "pairs": [
      {
        "pair": "EURUSD",
        "current_price": "${forexPrices["EURUSD"] || "N/A"}",
        "direction": "Bullish/Bearish",
        "confidence": 65,
        "target": "calculated from current price",
        "stop_loss": "calculated from current price",
        "reason": "Specific reason with real price and news",
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
        "confidence": 60,
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
        "pair": "USDJPY",
        "current_price": "${forexPrices["USDJPY"] || "N/A"}",
        "direction": "Bullish/Bearish",
        "confidence": 55,
        "target": "calculated",
        "stop_loss": "calculated",
        "reason": "Real reason",
        "volatility": "Medium",
        "volatility_score": 60,
        "expected_range": "XX pips",
        "best_time_cet": "01:00-05:00 CET",
        "key_support": "XXX.XX",
        "key_resistance": "XXX.XX"
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
      },
      {
        "pair": "AUDUSD",
        "current_price": "${forexPrices["AUDUSD"] || "N/A"}",
        "direction": "Bullish/Bearish",
        "confidence": 55,
        "target": "calculated",
        "stop_loss": "calculated",
        "reason": "Real reason",
        "volatility": "Medium",
        "volatility_score": 55,
        "expected_range": "XX pips",
        "best_time_cet": "01:00-05:00 CET",
        "key_support": "X.XXXX",
        "key_resistance": "X.XXXX"
      },
      {
        "pair": "GBPJPY",
        "current_price": "calculate from GBPUSD and USDJPY",
        "direction": "Bullish/Bearish",
        "confidence": 60,
        "target": "calculated",
        "stop_loss": "calculated",
        "reason": "Cross pair analysis",
        "volatility": "High",
        "volatility_score": 85,
        "expected_range": "XX pips",
        "best_time_cet": "09:00-12:00 CET",
        "key_support": "XXX.XX",
        "key_resistance": "XXX.XX"
      },
      {
        "pair": "EURJPY",
        "current_price": "calculate from EURUSD and USDJPY",
        "direction": "Bullish/Bearish",
        "confidence": 55,
        "target": "calculated",
        "stop_loss": "calculated",
        "reason": "Cross pair analysis",
        "volatility": "High",
        "volatility_score": 78,
        "expected_range": "XX pips",
        "best_time_cet": "09:00-12:00 CET",
        "key_support": "XXX.XX",
        "key_resistance": "XXX.XX"
      },
      {
        "pair": "EURGBP",
        "current_price": "calculate from EURUSD and GBPUSD",
        "direction": "Bullish/Bearish",
        "confidence": 50,
        "target": "calculated",
        "stop_loss": "calculated",
        "reason": "Cross pair analysis",
        "volatility": "Low",
        "volatility_score": 40,
        "expected_range": "XX pips",
        "best_time_cet": "09:00-11:00 CET",
        "key_support": "X.XXXX",
        "key_resistance": "X.XXXX"
      }
    ],
    "dxy_analysis": "How DXY is affecting all pairs today with specific levels",
    "best_forex_trade": "The single best forex trade today with exact entry, TP, SL"
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
    "meme_alert": "Any meme coin trending today",
    "best_crypto_trade": "Best crypto trade with entry, target, stop"
  },

  "cot_report": {
    "summary": "What institutions are positioned for this week",
    "positions": [
      { "pair": "EUR/USD", "position": "Net Long/Short +XX,000", "signal": "Bullish/Bearish", "insight": "What this means for trading today" },
      { "pair": "GBP/USD", "position": "Net Long/Short +XX,000", "signal": "Bullish/Bearish", "insight": "What this means" },
      { "pair": "USD/JPY", "position": "Net Long/Short +XX,000", "signal": "Bullish/Bearish", "insight": "What this means" },
      { "pair": "GOLD", "position": "Net Long/Short +XXX,000", "signal": "Bullish/Bearish", "insight": "What this means" },
      { "pair": "BTC", "position": "Net Long/Short +XX,000", "signal": "Bullish/Bearish", "insight": "What this means" }
    ]
  },

  "correlations": [
    { "assets": "DXY ↔ EURUSD", "value": "-0.XX", "meaning": "Specific meaning for today", "action": "What to do" },
    { "assets": "DXY ↔ GOLD", "value": "-0.XX", "meaning": "Specific meaning", "action": "What to do" },
    { "assets": "BTC ↔ SP500", "value": "+0.XX", "meaning": "Specific meaning", "action": "What to do" },
    { "assets": "OIL ↔ USDJPY", "value": "+0.XX", "meaning": "Specific meaning", "action": "What to do" }
  ],

  "economic_surprises": [
    { "event": "Recent real event", "result": "Beat/Miss with numbers", "impact": "How it affects today's trading" }
  ],

  "events_today": [
    { "time": "CET time", "currency": "USD", "event": "Event name", "impact": "High", "forecast": "XX", "previous": "XX", "expected_move": "XX pips on affected pairs" }
  ],

  "best_trades": [
    {
      "rank": 1,
      "asset": "Best pair today",
      "direction": "Buy/Sell",
      "entry": "real price",
      "target": "real target",
      "stop": "real stop",
      "confidence": 72,
      "risk_reward": "1:X.X",
      "timeframe": "Today",
      "reasoning": "Full reasoning with real data and news"
    },
    {
      "rank": 2,
      "asset": "Second best",
      "direction": "Buy/Sell",
      "entry": "real price",
      "target": "real target",
      "stop": "real stop",
      "confidence": 68,
      "risk_reward": "1:X.X",
      "timeframe": "24-48h",
      "reasoning": "Full reasoning"
    },
    {
      "rank": 3,
      "asset": "Third best (can be crypto)",
      "direction": "Buy/Sell",
      "entry": "real price",
      "target": "real target",
      "stop": "real stop",
      "confidence": 62,
      "risk_reward": "1:X.X",
      "timeframe": "48-72h",
      "reasoning": "Full reasoning"
    }
  ],

  "volatility_overview": {
    "overall": "Low/Medium/High/Extreme",
    "hottest_pair": "Which pair has most volatility today",
    "best_window_cet": "XX:00-XX:00 CET",
    "avoid_window_cet": "XX:00-XX:00 CET",
    "news_warning": "Specific warning about upcoming news"
  },

  "action_items": [
    "Specific action #1 with real prices",
    "Specific action #2",
    "Specific action #3"
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