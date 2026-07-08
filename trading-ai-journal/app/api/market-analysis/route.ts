import { NextResponse } from "next/server";

async function getRealTimePrices() {
  try {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    const pairs = ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD"];
    const prices: Record<string, any> = {};

    for (const pair of pairs) {
      try {
        let url = "";
        if (pair === "XAUUSD") {
          url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=XAU&to_currency=USD&apikey=${apiKey}`;
        } else {
          const from = pair.slice(0, 3);
          const to = pair.slice(3, 6);
          url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${from}&to_currency=${to}&apikey=${apiKey}`;
        }

        const response = await fetch(url, { next: { revalidate: 300 } });
        const data = await response.json();
        const rate = data["Realtime Currency Exchange Rate"];

        if (rate) {
          prices[pair] = {
            price: parseFloat(rate["5. Exchange Rate"]).toFixed(5),
            high: rate["7. Ask Price"],
            low: rate["8. Bid Price"],
            updated: rate["6. Last Refreshed"],
          };
        }
      } catch (err) {
        console.error(`Failed to fetch ${pair}:`, err);
      }
    }

    return prices;
  } catch (err) {
    return {};
  }
}

export async function POST(request: Request) {
  try {
    const { events } = await request.json();

    const today = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const eventsText = events.length > 0
      ? events.map((e: any) =>
          `${e.time} - ${e.currency} - ${e.event} - Impact: ${e.impact} - Forecast: ${e.forecast} - Previous: ${e.previous}`
        ).join("\n")
      : "No major economic events today.";

    // Fetch real-time prices
    const prices = await getRealTimePrices();
    const pricesText = Object.entries(prices).length > 0
      ? Object.entries(prices).map(([pair, data]: [string, any]) =>
          `${pair}: ${data.price} (Bid: ${data.low}, Ask: ${data.high})`
        ).join("\n")
      : "Real-time prices unavailable.";

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
            content: `You are an elite institutional forex analyst with 20 years of experience. 
You have deep knowledge of central bank policies, intermarket correlations, and smart money concepts.
Always give SPECIFIC, ACTIONABLE analysis based on the REAL prices and events provided.
Never give generic advice. Today is ${today}.`
          },
          {
            role: "user",
            content: `Today is ${today}.

REAL-TIME PRICES RIGHT NOW:
${pricesText}

Today's economic events:
${eventsText}

Based on these REAL prices and today's events, provide a comprehensive market analysis.

Consider:
1. Whether current prices are at key support/resistance levels
2. How today's events could push prices from current levels
3. Risk/reward based on current price positions
4. What smart money might be doing at these price levels

Return ONLY this exact JSON:
{
  "overall_bias": {
    "EURUSD": { "direction": "Bullish", "confidence": 65, "reason": "Price at 1.0850 near key support, ECB hawkish tone expected" },
    "GBPUSD": { "direction": "Bearish", "confidence": 55, "reason": "Price rejected at 1.2750 resistance, BOE dovish" },
    "XAUUSD": { "direction": "Bullish", "confidence": 70, "reason": "Gold at $2,350 support, risk off sentiment building" },
    "USDJPY": { "direction": "Bearish", "confidence": 60, "reason": "Price at 155.00 intervention zone, BOJ watching closely" }
  },
  "event_analysis": [
    {
      "event": "Event name",
      "currency": "USD",
      "current_price": "Current EURUSD price from real data",
      "if_beats": { 
        "direction": "USD Strong", 
        "probability": 72, 
        "avg_pips": 80,
        "target_price": "Where price could go if beats",
        "pairs_affected": ["EURUSD down 60-80 pips to X.XXXX", "GBPUSD down 50-70 pips"] 
      },
      "if_misses": { 
        "direction": "USD Weak", 
        "probability": 68, 
        "avg_pips": 60,
        "target_price": "Where price could go if misses",
        "pairs_affected": ["EURUSD up 50-70 pips to X.XXXX", "GBPUSD up 40-60 pips"] 
      },
      "trade_plan": "Specific entry with current price levels, exact SL and TP prices not just pips",
      "historical_note": "Specific historical statistics for this event"
    }
  ],
  "warning": "Specific warning about today's conditions",
  "best_pairs_to_trade": ["EURUSD", "XAUUSD"],
  "pairs_to_avoid": ["USDJPY"],
  "key_levels": {
    "EURUSD": "Support: X.XXXX, Resistance: X.XXXX, Current: X.XXXX",
    "GBPUSD": "Support: X.XXXX, Resistance: X.XXXX, Current: X.XXXX",
    "XAUUSD": "Support: $X,XXX, Resistance: $X,XXX, Current: $X,XXX"
  },
  "market_context": "2-3 sentences about current market conditions with specific price levels mentioned"
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

    // Add real prices to response
    parsed.real_prices = prices;

    return NextResponse.json(parsed);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}