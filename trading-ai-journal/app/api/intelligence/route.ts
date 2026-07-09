import { NextResponse } from "next/server";

async function getCOTData() {
  try {
    const response = await fetch(
      "https://newsapi.org/v2/everything?q=commitment+traders+COT+report+forex+institutional&sortBy=publishedAt&language=en&apiKey=" + process.env.NEWS_API_KEY + "&pageSize=5",
      { next: { revalidate: 86400 } }
    );
    const data = await response.json();
    if (data.articles) {
      return data.articles.map((a: any) => `${a.title}`).join("\n");
    }
    return "";
  } catch {
    return "";
  }
}

async function getMarketNews() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const queries = [
      "forex institutional positioning today",
      "gold bitcoin market overnight",
      "fed ecb boe central bank today",
      "SP500 DXY correlation today",
    ];

    const results: string[] = [];
    for (const q of queries) {
      try {
        const response = await fetch(
          `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&from=${today}&sortBy=publishedAt&language=en&apiKey=${process.env.NEWS_API_KEY}&pageSize=3`,
          { next: { revalidate: 3600 } }
        );
        const data = await response.json();
        if (data.articles) {
          data.articles.forEach((a: any) => results.push(`[${a.source.name}] ${a.title}`));
        }
      } catch {
        console.error("News fetch failed");
      }
    }
    return results.slice(0, 15).join("\n");
  } catch {
    return "";
  }
}

async function getPrices() {
  try {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    const pairs = [
      { from: "EUR", to: "USD", name: "EURUSD" },
      { from: "XAU", to: "USD", name: "XAUUSD" },
      { from: "BTC", to: "USD", name: "BTCUSD" },
    ];

    const prices: Record<string, string> = {};
    for (const pair of pairs) {
      try {
        const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${pair.from}&to_currency=${pair.to}&apikey=${apiKey}`;
        const response = await fetch(url, { next: { revalidate: 600 } });
        const data = await response.json();
        const rate = data["Realtime Currency Exchange Rate"];
        if (rate) {
          prices[pair.name] = parseFloat(rate["5. Exchange Rate"]).toFixed(
            pair.name === "BTCUSD" ? 0 : pair.name === "XAUUSD" ? 2 : 5
          );
        }
      } catch {
        console.error(`Failed ${pair.name}`);
      }
    }
    return prices;
  } catch {
    return {};
  }
}

export async function POST(request: Request) {
  try {
    const today = new Date().toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });

    const [cotNews, marketNews, prices] = await Promise.all([
      getCOTData(),
      getMarketNews(),
      getPrices(),
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
            content: `You are a Bloomberg Terminal AI analyst. Today is ${today}. 
You think like Goldman Sachs, JPMorgan, and Bridgewater combined.
You have access to COT data, institutional flow, correlations, and real prices.
Give SPECIFIC, ACTIONABLE intelligence that hedge funds would pay $2,000/month for.
Never use placeholder data. Always use real prices provided.`,
          },
          {
            role: "user",
            content: `Today is ${today}.

REAL PRICES NOW:
${pricesText}

COT REPORT NEWS:
${cotNews || "Use your knowledge of latest COT positioning."}

TODAY'S MARKET NEWS:
${marketNews || "Use your knowledge of current market conditions."}

Generate a complete Morning Intelligence Brief covering:

1. COT REPORT ANALYSIS — What are institutions positioned for?
2. CORRELATION MATRIX — How are DXY, Gold, BTC, SP500 correlating today?
3. ECONOMIC SURPRISE INDEX — Which recent data surprised markets?
4. MORNING BRIEF — What traders need to know right now

Return ONLY this JSON:
{
  "morning_brief": {
    "headline": "One powerful headline summarizing today's market",
    "summary": "3 sentences covering the most important things happening today",
    "generated_at": "${today}",
    "market_mood": "Risk-On/Risk-Off/Neutral",
    "overnight_moves": [
      { "asset": "EURUSD", "move": "+0.3%", "price": "${prices["EURUSD"] || "1.1430"}", "significance": "Why this move matters" },
      { "asset": "XAUUSD", "move": "+0.8%", "price": "${prices["XAUUSD"] || "2350"}", "significance": "Why this move matters" },
      { "asset": "BTCUSD", "move": "+2.1%", "price": "${prices["BTCUSD"] || "43000"}", "significance": "Why this move matters" }
    ],
    "key_theme": "The #1 theme driving markets today",
    "action_items": [
      "Specific action a trader should take today",
      "Second specific action",
      "Third specific action"
    ]
  },
  "cot_analysis": {
    "summary": "What COT data shows about institutional positioning this week",
    "positions": [
      { "pair": "EUR/USD", "institutions": "Net Long", "contracts": "+45,000", "change": "+12,000 from last week", "signal": "Bullish", "interpretation": "Institutions increasing EUR longs means they expect EUR to strengthen" },
      { "pair": "GBP/USD", "institutions": "Net Short", "contracts": "-23,000", "change": "-5,000 from last week", "signal": "Bearish", "interpretation": "Institutions reducing GBP exposure, bearish signal" },
      { "pair": "USD/JPY", "institutions": "Net Long", "contracts": "+67,000", "change": "+8,000", "signal": "Bullish USD", "interpretation": "Smart money still long USD vs JPY despite intervention risk" },
      { "pair": "GOLD", "institutions": "Net Long", "contracts": "+285,000", "change": "+22,000", "signal": "Bullish", "interpretation": "Highest gold longs in 6 months - institutions expect gold to rise" },
      { "pair": "BTC", "institutions": "Net Long", "contracts": "+15,000", "change": "+3,000", "signal": "Bullish", "interpretation": "Institutional BTC accumulation continues" }
    ],
    "key_insight": "The most important thing COT data tells us this week"
  },
  "correlation_matrix": {
    "summary": "How major assets are correlating today",
    "correlations": [
      { "pair1": "DXY", "pair2": "EURUSD", "correlation": "-0.92", "strength": "Very Strong Negative", "meaning": "When DXY rises, EURUSD falls. Today DXY is X so EURUSD should Y", "trade_implication": "Watch DXY for EURUSD direction" },
      { "pair1": "DXY", "pair2": "XAUUSD", "correlation": "-0.78", "strength": "Strong Negative", "meaning": "Dollar weakness = gold strength", "trade_implication": "If USD weakens today, buy gold" },
      { "pair1": "BTC", "pair2": "SP500", "correlation": "+0.65", "strength": "Moderate Positive", "meaning": "BTC following risk assets", "trade_implication": "If SP500 opens higher, BTC likely follows" },
      { "pair1": "XAUUSD", "pair2": "USDJPY", "correlation": "-0.71", "strength": "Strong Negative", "meaning": "Both are safe haven plays", "trade_implication": "When JPY strengthens, gold usually rises too" }
    ],
    "key_correlation_today": "The most important correlation to watch today and why"
  },
  "economic_surprise_index": {
    "summary": "How recent economic data compared to expectations",
    "recent_surprises": [
      { "event": "US NFP", "date": "Last Friday", "expected": "180K", "actual": "150K", "surprise": "Miss -30K", "market_reaction": "USD sold off, EURUSD jumped 80 pips", "ongoing_impact": "Still weighing on USD this week" },
      { "event": "EU CPI", "date": "This week", "expected": "2.3%", "actual": "2.1%", "surprise": "Miss -0.2%", "market_reaction": "EUR dipped initially then recovered", "ongoing_impact": "ECB less likely to hike, slightly EUR bearish" }
    ],
    "surprise_index_score": {
      "USD": "-2 (data consistently missing = USD weakness)",
      "EUR": "+1 (slight positive surprises = mild EUR strength)",
      "GBP": "0 (mixed data = neutral)",
      "JPY": "+3 (BOJ surprises = JPY volatile)"
    },
    "key_insight": "Which currency has the best economic momentum right now and why"
  },
  "best_trades_today": [
    {
      "rank": 1,
      "asset": "EURUSD",
      "direction": "Buy",
      "entry": "real entry based on current price",
      "target": "real target",
      "stop": "real stop",
      "confidence": 72,
      "timeframe": "Today - 24 hours",
      "reasoning": "COT institutions net long EUR + USD data missing + correlation with DXY weakness"
    },
    {
      "rank": 2,
      "asset": "XAUUSD",
      "direction": "Buy",
      "entry": "real entry",
      "target": "real target",
      "stop": "real stop",
      "confidence": 68,
      "timeframe": "24-48 hours",
      "reasoning": "Institutions at 6-month high in gold longs + risk-off sentiment + DXY weakness"
    },
    {
      "rank": 3,
      "asset": "BTC",
      "direction": "Buy",
      "entry": "real entry",
      "target": "real target",
      "stop": "real stop",
      "confidence": 62,
      "timeframe": "48-72 hours",
      "reasoning": "Institutional accumulation + SP500 correlation positive + market risk-on"
    }
  ]
}`,
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
    console.error("Intelligence error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}