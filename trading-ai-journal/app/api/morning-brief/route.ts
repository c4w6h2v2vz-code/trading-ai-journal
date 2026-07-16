import { NextResponse } from "next/server";

export const maxDuration = 60;

async function getGoldPrice() {
  try {
    const response = await fetch("https://data-asg.goldprice.org/dbXRates/USD", { cache: "no-store" });
    const data = await response.json();
    const xauPrice = data?.items?.[0]?.xauPrice;
    if (xauPrice && !isNaN(xauPrice)) return Number(xauPrice).toFixed(2);
    return null;
  } catch (err) {
    console.error("Gold price fetch failed:", err);
    return null;
  }
}

async function getForexPrices() {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  const prices: Record<string, string> = {};

  const pairs = [
    { from: "EUR", to: "USD", name: "EURUSD", digits: 5 },
    { from: "GBP", to: "USD", name: "GBPUSD", digits: 5 },
  ];

  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i];
    try {
      const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${pair.from}&to_currency=${pair.to}&apikey=${apiKey}`;
      const response = await fetch(url, { cache: "no-store" });
      const data = await response.json();

      if (data["Note"] || data["Information"]) {
        console.error(`Alpha Vantage rate limit hit for ${pair.name}:`, data["Note"] || data["Information"]);
      } else {
        const rate = data["Realtime Currency Exchange Rate"];
        if (rate && rate["5. Exchange Rate"]) {
          const price = parseFloat(rate["5. Exchange Rate"]);
          if (!isNaN(price) && price > 0) prices[pair.name] = price.toFixed(pair.digits);
        } else {
          console.error(`No rate data for ${pair.name}:`, JSON.stringify(data).slice(0, 200));
        }
      }
      if (i < pairs.length - 1) await new Promise(r => setTimeout(r, 13000));
    } catch (err) {
      console.error("Price fetch failed:", pair.name, err);
    }
  }

  const gold = await getGoldPrice();
  if (gold) prices["XAUUSD"] = gold;

  return prices;
}

async function getUsdNews() {
  const today = new Date().toISOString().slice(0, 10);
  const items: { source: string; title: string; url: string }[] = [];

  const queries = ["federal reserve dollar", "US inflation CPI", "US jobs economy"];

  for (const q of queries) {
    try {
      const response = await fetch(
        `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&from=${today}&sortBy=publishedAt&language=en&apiKey=${process.env.NEWS_API_KEY}&pageSize=5`,
        { cache: "no-store" }
      );
      const data = await response.json();
      if (data.articles) {
        data.articles.forEach((a: any) => items.push({ source: a.source.name, title: a.title, url: a.url }));
      }
    } catch {
      console.error("News fetch failed:", q);
    }
  }

  return items.slice(0, 12);
}

async function getUsdEvents() {
  try {
    const response = await fetch("https://nfs.faireconomy.media/ff_calendar_thisweek.json", { cache: "no-store" });
    const data = await response.json();
    if (!Array.isArray(data)) return [];

    const today = new Date().toISOString().slice(0, 10);

    return data
      .filter((e: any) => e.country === "USD")
      .filter((e: any) => String(e.date).slice(0, 10) === today)
      .map((e: any) => ({
        title: e.title,
        date: e.date,
        impact: e.impact,
        forecast: e.forecast || "n/a",
        previous: e.previous || "n/a",
      }));
  } catch (err) {
    console.error("Economic calendar fetch failed:", err);
    return [];
  }
}

export async function POST() {
  try {
    const now = new Date();
    const viennaTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Vienna" }));
    const dayOfWeek = viennaTime.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const today = now.toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "Europe/Vienna",
    });
    const euTime = now.toLocaleTimeString("en-US", {
      hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Europe/Vienna",
    });

    const [prices, news, events] = await Promise.all([
      isWeekend ? Promise.resolve({} as Record<string, string>) : getForexPrices(),
      getUsdNews(),
      isWeekend ? Promise.resolve([]) : getUsdEvents(),
    ]);

    const availablePairs = ["EURUSD", "GBPUSD", "XAUUSD"].filter(p => prices[p]);
    const missingPairs = ["EURUSD", "GBPUSD", "XAUUSD"].filter(p => !prices[p]);

    const pricesText = availablePairs.length > 0
      ? availablePairs.map(p => `${p}: ${prices[p]}`).join(" | ")
      : (isWeekend ? "Forex markets closed (weekend)" : "No forex prices available right now");

    const newsText = news.length > 0
      ? news.map(n => `[Source: ${n.source}] ${n.title}`).join("\n")
      : "No USD news retrieved today.";

    const eventsText = events.length > 0
      ? events.map((e: any) => `${e.title} | Impact: ${e.impact} | Forecast: ${e.forecast} | Previous: ${e.previous}`).join("\n")
      : "No USD economic events scheduled today.";

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an institutional market analyst inside PipTrak. Today is ${today}, ${euTime} CET.

SCOPE: Only EURUSD, GBPUSD, XAUUSD. Only USD-driven news and events. Ignore all other pairs and currencies.

ABSOLUTE RULES — violating these is a critical failure:
1. NEVER invent a price. Only use the exact prices provided below.
2. If a pair's price is NOT provided, you MUST set its current_price to "Price unavailable" and set target, stop_loss, key_support, key_resistance ALL to "Unavailable - no live price". Do NOT calculate levels from memory. Do NOT guess.
3. Only include a pair in "pairs" if its real price was provided. ${missingPairs.length > 0 ? `These pairs have NO price today and must be handled per rule 2: ${missingPairs.join(", ")}` : ""}
4. Every claim about why markets are moving must cite a source by name from the news list. If no news supports it, say "based on price action only".
5. Historical context is a TENDENCY, never a prediction. Never say a market WILL move.
6. Never invent statistics or percentages of past outcomes.
${isWeekend ? "7. TODAY IS WEEKEND. Forex is closed. Say so plainly and give no forex trade setups." : ""}`,
          },
          {
            role: "user",
            content: `Today: ${today} at ${euTime} CET
${isWeekend ? "WEEKEND — forex closed." : "Forex markets open."}

REAL LIVE PRICES (the ONLY prices you may use):
${pricesText}
${missingPairs.length > 0 && !isWeekend ? `\nPAIRS WITH NO PRICE TODAY (apply rule 2): ${missingPairs.join(", ")}` : ""}

TODAY'S USD ECONOMIC EVENTS:
${eventsText}

TODAY'S USD NEWS (with real sources):
${newsText}

Produce today's Morning Brief. Return ONLY this JSON:
{
  "brief_date": "${today}",
  "brief_time": "${euTime} CET",
  "is_weekend": ${isWeekend},
  "headline": "One sharp sentence on what matters for USD today, citing a real source if available",
  "market_mood": "Risk-On" or "Risk-Off" or "Neutral",
  "summary": "3-4 sentences on today's USD picture. Cite sources by name. If prices are missing, say so honestly.",
  "key_theme": "The single dominant USD driver today",
  "usd_bias": {
    "direction": "Bullish USD / Bearish USD / Neutral",
    "reasoning": "Why, citing real news sources or price action",
    "confidence_note": "Plain-English statement of how clear or unclear this read is. Never a fake percentage."
  },
  "pairs": [
    {
      "pair": "EURUSD",
      "current_price": "exact real price provided, or 'Price unavailable'",
      "direction": "Bullish/Bearish/Neutral",
      "reason": "Why, citing source or price action",
      "target": "level calculated from the REAL price, or 'Unavailable - no live price'",
      "stop_loss": "level from REAL price, or 'Unavailable - no live price'",
      "key_support": "from REAL price, or 'Unavailable - no live price'",
      "key_resistance": "from REAL price, or 'Unavailable - no live price'",
      "volatility": "Low/Medium/High",
      "expected_range": "realistic range or 'Unavailable'",
      "best_time_cet": "e.g. 09:00-11:00 CET"
    }
  ],
  "events_today": [
    {
      "time": "CET time if known, else 'Time TBC'",
      "event": "Real event name from the list only",
      "impact": "High/Medium/Low",
      "forecast": "real forecast from data",
      "previous": "real previous from data",
      "bias_direction": "Bullish USD / Bearish USD / Mixed",
      "bias_strength": "Strong tendency / Moderate tendency / Weak-Mixed",
      "historical_note": "How this TYPE of event has generally tended to move USD. State plainly it is a tendency, not a guarantee. If you lack reliable knowledge, say so.",
      "if_beats_forecast": "General tendency if the number beats forecast",
      "if_misses_forecast": "General tendency if the number misses forecast"
    }
  ],
  "best_setup": {
    "pair": "Only EURUSD, GBPUSD or XAUUSD, and only one with a REAL price. If none have prices, set pair to 'None - no live prices available' and all other fields to 'Unavailable'.",
    "direction": "Buy/Sell",
    "entry": "from real price",
    "target": "from real price",
    "stop": "from real price",
    "risk_reward": "1:X",
    "reasoning": "Why this setup, citing source or price action",
    "invalidation": "What would kill this idea"
  },
  "warnings": ["Real risks today. Include a warning if any price was unavailable."],
  "action_items": ["2-4 concrete things to do today"]
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

    parsed.real_prices = prices;
    parsed.missing_pairs = missingPairs;
    parsed.news_items = news;
    parsed.raw_events = events;
    parsed.generated_at = new Date().toISOString();

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Morning brief error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}