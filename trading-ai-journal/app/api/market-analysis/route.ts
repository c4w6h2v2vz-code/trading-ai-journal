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
      } catch {
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
    const coins = ["BTC", "ETH", "SOL"];
    const prices: Record<string, any> = {};
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;

    for (const coin of coins) {
      try {
        const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${coin}&to_currency=USD&apikey=${apiKey}`;
        const response = await fetch(url, { next: { revalidate: 300 } });
        const data = await response.json();
        const rate = data["Realtime Currency Exchange Rate"];
        if (rate) {
          prices[coin] = {
            price: parseFloat(rate["5. Exchange Rate"]).toFixed(2),
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

async function scanAllNews() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const queries = [
      "forex market today fed reserve",
      "gold dollar euro pound today",
      "central bank interest rates today",
      "smart money institutional forex",
      "Goldman Sachs JPMorgan market outlook",
      "forex technical analysis today",
      "DXY dollar index today",
    ];

    const results: string[] = [];

    for (const q of queries) {
      try {
        const response = await fetch(
          `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&from=${today}&sortBy=publishedAt&language=en&apiKey=${process.env.NEWS_API_KEY}&pageSize=3`,
          { next: { revalidate: 1800 } }
        );
        const data = await response.json();
        if (data.articles) {
          data.articles.forEach((a: any) => {
            results.push(`[${a.source.name}] ${a.title}`);
          });
        }
      } catch {
        console.error(`News fetch failed for: ${q}`);
      }
    }

    return results.slice(0, 25).join("\n");
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

    const todayDate = new Date().toISOString().slice(0, 10);

    const eventsText = events.length > 0
      ? events.map((e: any) =>
          `${e.time} - ${e.currency} - ${e.event} - Impact: ${e.impact} - Forecast: ${e.forecast} - Previous: ${e.previous}`
        ).join("\n")
      : "No major economic events today.";

    const [forexPrices, cryptoPrices, newsHeadlines] = await Promise.all([
      getRealTimePrices(),
      getCryptoPrices(),
      scanAllNews(),
    ]);

    const forexText = Object.entries(forexPrices).length > 0
      ? Object.entries(forexPrices).map(([pair, d]: [string, any]) =>
          `${pair}: ${d.price} (Bid: ${d.bid}, Ask: ${d.ask})`).join("\n")
      : "Forex prices temporarily unavailable";

    const cryptoText = Object.entries(cryptoPrices).length > 0
      ? Object.entries(cryptoPrices).map(([coin, d]: [string, any]) =>
          `${coin}/USD: $${d.price}`).join("\n")
      : "Crypto prices temporarily unavailable";

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
            content: `You are an elite institutional forex and crypto analyst. Today is ${today}.
You think like Goldman Sachs, JPMorgan, and Bridgewater combined.
You analyze smart money positioning, central bank policy, DXY correlation, and institutional flow.
ALWAYS use the real prices provided. NEVER use example data.
Give SPECIFIC price targets and percentage moves based on REAL current prices.`,
          },
          {
            role: "user",
            content: `Today is ${today} (${todayDate}).

REAL-TIME FOREX PRICES:
${forexText}

REAL-TIME CRYPTO PRICES:
${cryptoText}

TODAY'S ECONOMIC EVENTS:
${eventsText}

TODAY'S NEWS FROM BLOOMBERG, REUTERS, FINANCIAL TIMES AND MORE:
${newsHeadlines || "Use your knowledge of current market conditions as of today."}

Based on ALL this real data, provide institutional-level market analysis.

Think like smart money:
- Where are institutions positioned right now?
- What does DXY movement mean for EURUSD and XAUUSD?
- What are central banks signaling?
- Where is the liquidity sitting above/below current prices?
- What would Goldman Sachs tell their clients today?
- How does today's news affect crypto markets?

IMPORTANT: Use REAL prices above for all analysis. Calculate real pip targets from current price levels.

Return ONLY this JSON:
{
  "analysis_date": "${today}",
  "market_context": "What smart money is thinking today based on real news - 3 sentences",
  "dxy_analysis": "How DXY is affecting all pairs today",
  "institutional_flow": "Where institutions are flowing money today based on news",
  "overall_bias": {
    "EURUSD": { 
      "direction": "Bullish", 
      "confidence": 65, 
      "current_price": "real price from above",
      "target": "real target price",
      "reason": "Institutional reason with real price levels" 
    },
    "GBPUSD": { 
      "direction": "Bearish", 
      "confidence": 55, 
      "current_price": "real price",
      "target": "real target",
      "reason": "Real reason" 
    },
    "XAUUSD": { 
      "direction": "Bullish", 
      "confidence": 70, 
      "current_price": "real price",
      "target": "real target",
      "reason": "Real reason" 
    },
    "USDJPY": { 
      "direction": "Bearish", 
      "confidence": 60, 
      "current_price": "real price",
      "target": "real target",
      "reason": "Real reason" 
    }
  },
  "crypto_analysis": {
    "market_sentiment": "Bullish",
    "fear_greed": "68 - Greed",
    "btc_analysis": "What BTC is doing today based on real price and news",
    "best_coins_today": [
      {
        "coin": "BTC",
        "current_price": "real BTC price",
        "direction": "Bullish",
        "probability": 68,
        "target": "real target price",
        "move_percent": "+3.5%",
        "reason": "Real reason based on today's news",
        "community_buzz": "Real community sentiment today",
        "category": "Layer1"
      }
    ],
    "coins_to_avoid": ["real coin name"],
    "meme_coin_alert": "Real meme coin activity today",
    "crypto_trade_plan": "Real crypto trade for today with specific prices"
  },
  "event_analysis": [
    {
      "event": "Event name",
      "currency": "USD",
      "if_beats": { 
        "direction": "USD Strong", 
        "probability": 72, 
        "avg_pips": 80, 
        "pairs_affected": ["EURUSD down to REAL.PRICE", "BTC could drop 2-3%"] 
      },
      "if_misses": { 
        "direction": "USD Weak", 
        "probability": 68, 
        "avg_pips": 60, 
        "pairs_affected": ["EURUSD up to REAL.PRICE", "BTC could pump 3-5%"] 
      },
      "trade_plan": "Specific trade with real entry/exit prices",
      "historical_note": "Real historical stats for this event"
    }
  ],
  "warning": "Real warning about today's specific conditions",
  "best_pairs_to_trade": ["EURUSD", "XAUUSD"],
  "pairs_to_avoid": ["USDJPY"],
  "key_levels": {
    "EURUSD": "Support: REAL.PRICE, Resistance: REAL.PRICE, Current: REAL.PRICE",
    "GBPUSD": "Support: REAL.PRICE, Resistance: REAL.PRICE, Current: REAL.PRICE",
    "XAUUSD": "Support: $REAL, Resistance: $REAL, Current: $REAL",
    "BTCUSD": "Support: $REAL, Resistance: $REAL, Current: $REAL"
  },
  "smart_money_summary": "What Goldman Sachs, JPMorgan level analysis says about today's market"
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
    parsed.generated_at = new Date().toISOString();

    return NextResponse.json(parsed);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}