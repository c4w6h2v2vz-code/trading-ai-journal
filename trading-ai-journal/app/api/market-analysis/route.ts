import { NextResponse } from "next/server";

async function getRealTimePrices() {
  try {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    const pairs = ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD"];
    const prices: Record<string, any> = {};

    for (const pair of pairs) {
      try {
        const from = pair === "XAUUSD" ? "XAU" : pair.slice(0, 3);
        const to = pair === "XAUUSD" ? "USD" : pair.slice(3, 6);
        const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${from}&to_currency=${to}&apikey=${apiKey}`;
        const response = await fetch(url, { next: { revalidate: 300 } });
        const data = await response.json();
        const rate = data["Realtime Currency Exchange Rate"];
        if (rate) {
          prices[pair] = {
            price: parseFloat(rate["5. Exchange Rate"]).toFixed(5),
            bid: rate["8. Bid Price"],
            ask: rate["7. Ask Price"],
          };
        }
      } catch (err) {
        console.error(`Failed to fetch ${pair}`);
      }
    }
    return prices;
  } catch {
    return {};
  }
}

async function getCryptoPrices() {
  try {
    const coins = ["BTC", "ETH", "SOL", "DOGE", "XRP"];
    const prices: Record<string, any> = {};

    for (const coin of coins) {
      try {
        const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
        const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${coin}&to_currency=USD&apikey=${apiKey}`;
        const response = await fetch(url, { next: { revalidate: 300 } });
        const data = await response.json();
        const rate = data["Realtime Currency Exchange Rate"];
        if (rate) {
          prices[coin] = {
            price: parseFloat(rate["5. Exchange Rate"]).toFixed(2),
            bid: rate["8. Bid Price"],
            ask: rate["7. Ask Price"],
          };
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

async function getTodaysNews() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=forex+crypto+trading&from=${today}&sortBy=publishedAt&language=en&apiKey=${process.env.NEWS_API_KEY}&pageSize=10`,
      { next: { revalidate: 1800 } }
    );
    const data = await response.json();
    if (data.articles) {
      return data.articles.map((a: any) => `- ${a.title}`).join("\n");
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
      : "No major economic events today.";

    const [forexPrices, cryptoPrices, newsHeadlines] = await Promise.all([
      getRealTimePrices(),
      getCryptoPrices(),
      getTodaysNews(),
    ]);

    const forexText = Object.entries(forexPrices).length > 0
      ? Object.entries(forexPrices).map(([pair, d]: [string, any]) =>
          `${pair}: ${d.price}`).join(" | ")
      : "Forex prices unavailable";

    const cryptoText = Object.entries(cryptoPrices).length > 0
      ? Object.entries(cryptoPrices).map(([coin, d]: [string, any]) =>
          `${coin}/USD: $${d.price}`).join(" | ")
      : "Crypto prices unavailable";

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
            content: `You are an elite market analyst covering both forex and crypto markets. Today is ${today}.
You have access to real-time prices and today's news. Give SPECIFIC, ACTIONABLE analysis.
For crypto, analyze meme coins, altcoins, and major coins.
Always mention specific price targets and percentage moves.`,
          },
          {
            role: "user",
            content: `Today is ${today}.

REAL-TIME FOREX PRICES:
${forexText}

REAL-TIME CRYPTO PRICES:
${cryptoText}

TODAY'S ECONOMIC EVENTS:
${eventsText}

TODAY'S NEWS HEADLINES:
${newsHeadlines || "No news headlines available - use your knowledge of current market conditions."}

Based on ALL this data, provide a comprehensive forex + crypto market analysis.

For crypto specifically:
- Which coins have the highest probability of moving significantly today?
- Are there any meme coins showing momentum?
- What percentage moves are realistic?
- How does today's forex news affect crypto?

Return ONLY this exact JSON:
{
  "overall_bias": {
    "EURUSD": { "direction": "Bullish", "confidence": 65, "reason": "Specific reason with price" },
    "GBPUSD": { "direction": "Bearish", "confidence": 55, "reason": "Specific reason with price" },
    "XAUUSD": { "direction": "Bullish", "confidence": 70, "reason": "Specific reason with price" },
    "USDJPY": { "direction": "Bearish", "confidence": 60, "reason": "Specific reason with price" }
  },
  "crypto_analysis": {
    "market_sentiment": "Bullish/Bearish/Neutral",
    "fear_greed": "65 - Greed",
    "best_coins_today": [
      {
        "coin": "BTC",
        "current_price": "$43,250",
        "direction": "Bullish",
        "probability": 68,
        "target": "$44,500",
        "move_percent": "+2.9%",
        "reason": "Specific reason based on today's news and price"
      },
      {
        "coin": "ETH",
        "current_price": "$2,280",
        "direction": "Bullish",
        "probability": 62,
        "target": "$2,350",
        "move_percent": "+3.1%",
        "reason": "Specific reason"
      },
      {
        "coin": "DOGE",
        "current_price": "$0.12",
        "direction": "Bullish",
        "probability": 55,
        "target": "$0.135",
        "move_percent": "+12.5%",
        "reason": "Meme coin momentum + social media trending"
      }
    ],
    "coins_to_avoid": ["XRP", "ADA"],
    "meme_coin_alert": "Any meme coin trending today and why",
    "crypto_trade_plan": "Specific crypto trade recommendation for today"
  },
  "event_analysis": [
    {
      "event": "Event name",
      "currency": "USD",
      "if_beats": { "direction": "USD Strong", "probability": 72, "avg_pips": 80, "pairs_affected": ["EURUSD down 60-80 pips", "BTC could drop 2-3%"] },
      "if_misses": { "direction": "USD Weak", "probability": 68, "avg_pips": 60, "pairs_affected": ["EURUSD up 50-70 pips", "BTC could pump 3-5%"] },
      "trade_plan": "Specific trade plan with prices",
      "historical_note": "Historical statistics"
    }
  ],
  "warning": "Specific warning for today",
  "best_pairs_to_trade": ["EURUSD", "BTCUSD"],
  "pairs_to_avoid": ["USDJPY"],
  "key_levels": {
    "EURUSD": "Support: X.XXXX, Resistance: X.XXXX",
    "BTCUSD": "Support: $XX,XXX, Resistance: $XX,XXX",
    "XAUUSD": "Support: $X,XXX, Resistance: $X,XXX"
  },
  "market_context": "2-3 sentences covering both forex and crypto market conditions today"
}`
          }
        ],
      }),
    });

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    const parsed = JSON.parse(jsonMatch[0]);
    parsed.real_prices = { forex: forexPrices, crypto: cryptoPrices };

    return NextResponse.json(parsed);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}