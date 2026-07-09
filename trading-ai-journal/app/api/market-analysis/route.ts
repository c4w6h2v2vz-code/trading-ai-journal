import { NextResponse } from "next/server";

async function scanCryptoNews() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const queries = [
      "memecoin pump today",
      "crypto trending today",
      "bitcoin ethereum price today",
      "crypto whale alert today",
      "dogecoin shiba pepe news today",
    ];

    const results: string[] = [];

    for (const q of queries) {
      try {
        const response = await fetch(
          `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&from=${today}&sortBy=publishedAt&language=en&apiKey=${process.env.NEWS_API_KEY}&pageSize=5`,
          { next: { revalidate: 1800 } }
        );
        const data = await response.json();
        if (data.articles) {
          data.articles.forEach((a: any) => {
            results.push(`- ${a.title} (${a.source.name})`);
          });
        }
      } catch {
        console.error(`Failed news fetch`);
      }
    }

    return results.slice(0, 20).join("\n");
  } catch {
    return "";
  }
}

async function getCryptoPrices() {
  try {
    const coins = ["BTC", "ETH", "SOL", "DOGE", "XRP"];
    const prices: Record<string, string> = {};
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;

    for (const coin of coins) {
      try {
        const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${coin}&to_currency=USD&apikey=${apiKey}`;
        const response = await fetch(url, { next: { revalidate: 300 } });
        const data = await response.json();
        const rate = data["Realtime Currency Exchange Rate"];
        if (rate) {
          prices[coin] = parseFloat(rate["5. Exchange Rate"]).toFixed(
            coin === "BTC" ? 0 : coin === "ETH" || coin === "SOL" ? 2 : 4
          );
        }
      } catch {
        console.error(`Failed to fetch ${coin}`);
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

    const todayDate = new Date().toISOString().slice(0, 10);

    const [newsHeadlines, prices] = await Promise.all([
      scanCryptoNews(),
      getCryptoPrices(),
    ]);

    const pricesText = Object.entries(prices).length > 0
      ? Object.entries(prices).map(([coin, price]) => `${coin}: $${price}`).join("\n")
      : "Prices temporarily unavailable";

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
            content: `You are an elite crypto analyst. Today's date is ${today} (${todayDate}).
You must provide REAL analysis based on actual market conditions RIGHT NOW.
NEVER use placeholder or example data.
All prices, percentages, and targets must be based on the REAL prices provided.
Be specific about percentage moves - use ranges like "+8% to +15%".`,
          },
          {
            role: "user",
            content: `Today is ${today}.

REAL CRYPTO PRICES RIGHT NOW:
${pricesText}

TODAY'S REAL NEWS HEADLINES:
${newsHeadlines || "Use your knowledge of crypto market conditions as of ${todayDate}."}

Based on REAL data above, analyze:
1. Which coins are showing real momentum TODAY (${todayDate})?
2. What are realistic percentage move targets based on current prices?
3. What is actually happening in meme coin communities right now?
4. Which coins do whales seem to be accumulating based on recent news?
5. What should a trader do TODAY specifically?

IMPORTANT RULES:
- Use the REAL prices shown above for all calculations
- Give SPECIFIC percentage targets (e.g. "+8% to +15%")
- Base analysis on ${today} conditions
- Never use fake example data like "$0.0000089" unless that's the real PEPE price

Return ONLY this JSON with REAL data:
{
  "analysis_date": "${today}",
  "market_overview": {
    "sentiment": "Bullish/Bearish/Neutral",
    "fear_greed": "Number + label e.g. 68 - Greed",
    "btc_dominance": "Real estimate e.g. 54%",
    "market_trend": "What is actually happening in crypto right now on ${todayDate}"
  },
  "top_coins_to_watch": [
    {
      "coin": "BTC",
      "price": "Real price from above",
      "timeframe": "24-48 hours",
      "direction": "Bullish",
      "probability": 65,
      "potential_gain": "+5% to +8%",
      "potential_loss": "-4%",
      "risk_level": "Medium",
      "sentiment_score": 72,
      "momentum_score": 68,
      "reason": "Real reason based on today's news",
      "community_buzz": "Real community activity",
      "entry": "Real entry based on current price",
      "target": "Real target price",
      "stop_loss": "Real stop loss",
      "category": "Layer1"
    }
  ],
  "meme_coins_alert": [
    {
      "coin": "Real memecoin",
      "reason": "Real reason trending today",
      "buzz_level": "High",
      "risk": "High"
    }
  ],
  "whale_alerts": [
    {
      "coin": "Real coin",
      "action": "Real whale activity",
      "impact": "Expected price impact"
    }
  ],
  "coins_to_avoid": [
    {
      "coin": "Real coin",
      "reason": "Real reason to avoid today",
      "risk": "High"
    }
  ],
  "rug_pull_warnings": [],
  "best_trade_today": {
    "coin": "Best coin for today",
    "entry": "Real entry price",
    "target": "Real target with percentage",
    "stop_loss": "Real stop loss",
    "timeframe": "24-48 hours",
    "reason": "Real detailed reason for today ${todayDate}"
  },
  "weekly_outlook": "Real weekly outlook for crypto this week starting ${todayDate}"
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
    parsed.real_prices = prices;
    parsed.generated_at = new Date().toISOString();

    return NextResponse.json(parsed);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}