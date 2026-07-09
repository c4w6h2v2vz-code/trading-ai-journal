import { NextResponse } from "next/server";

async function scanCryptoNews() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const queries = [
      "memecoin pump 2026",
      "crypto trending today",
      "altcoin moon 2026",
      "crypto whale buying",
      "dogecoin shiba pepe trending",
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
        console.error(`Failed to fetch news for: ${q}`);
      }
    }

    return results.join("\n");
  } catch {
    return "";
  }
}

async function getCryptoPrices() {
  try {
    const coins = ["BTC", "ETH", "SOL", "DOGE", "SHIB", "PEPE", "XRP", "BNB", "ADA", "AVAX"];
    const prices: Record<string, string> = {};
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;

    for (const coin of coins.slice(0, 5)) {
      try {
        const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${coin}&to_currency=USD&apikey=${apiKey}`;
        const response = await fetch(url, { next: { revalidate: 300 } });
        const data = await response.json();
        const rate = data["Realtime Currency Exchange Rate"];
        if (rate) {
          prices[coin] = parseFloat(rate["5. Exchange Rate"]).toFixed(coin === "BTC" ? 0 : coin === "ETH" ? 0 : 4);
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

    const [newsHeadlines, prices] = await Promise.all([
      scanCryptoNews(),
      getCryptoPrices(),
    ]);

    const pricesText = Object.entries(prices).length > 0
      ? Object.entries(prices).map(([coin, price]) => `${coin}: $${price}`).join(" | ")
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
            content: `You are an elite crypto market analyst specializing in memecoin trends, community sentiment, and short-term price movements. Today is ${today}. You analyze Reddit, Twitter, Telegram trends and news to find coins with high probability of moving in the next 24-72 hours. Be specific and data-driven.`,
          },
          {
            role: "user",
            content: `Today is ${today}.

REAL-TIME CRYPTO PRICES:
${pricesText}

TODAY'S CRYPTO NEWS AND COMMUNITY BUZZ:
${newsHeadlines || "Use your knowledge of current crypto market conditions as of today."}

Based on this data, provide a comprehensive crypto intelligence report.

Analyze:
1. Which memecoins are showing community momentum right now?
2. Which coins have whale activity or unusual volume?
3. Which coins are trending on social media today?
4. What's the overall crypto market sentiment?
5. Which coins have the best risk/reward for the next 24-72 hours?
6. Are there any rug pull risks or manipulation signs?

Return ONLY this exact JSON:
{
  "market_overview": {
    "sentiment": "Bullish",
    "fear_greed": "72 - Greed",
    "btc_dominance": "52%",
    "market_trend": "Altcoin season starting - capital rotating from BTC to alts"
  },
  "top_coins_to_watch": [
    {
      "coin": "PEPE",
      "price": "$0.0000089",
      "timeframe": "24-48 hours",
      "direction": "Bullish",
      "probability": 72,
      "potential_gain": "+25%",
      "potential_loss": "-15%",
      "risk_level": "High",
      "sentiment_score": 85,
      "momentum_score": 78,
      "reason": "Trending on Twitter with 50k mentions, whale bought $2M worth 6 hours ago",
      "community_buzz": "Reddit r/CryptoMoonShots top post, TikTok viral",
      "entry": "$0.0000085",
      "target": "$0.0000112",
      "stop_loss": "$0.0000072",
      "category": "Memecoin"
    }
  ],
  "meme_coins_alert": [
    {
      "coin": "DOGE",
      "reason": "Elon Musk tweeted about it 2 hours ago",
      "buzz_level": "Very High",
      "risk": "Medium"
    }
  ],
  "whale_alerts": [
    {
      "coin": "ETH",
      "action": "Large wallet bought $5M",
      "impact": "Bullish signal - smart money accumulating"
    }
  ],
  "coins_to_avoid": [
    {
      "coin": "XRP",
      "reason": "SEC lawsuit uncertainty, low community momentum",
      "risk": "High"
    }
  ],
  "rug_pull_warnings": [
    {
      "coin": "Example coin name",
      "warning": "New coin with no audit, suspicious tokenomics"
    }
  ],
  "best_trade_today": {
    "coin": "SOL",
    "entry": "$95",
    "target": "$108",
    "stop_loss": "$88",
    "timeframe": "48 hours",
    "reason": "Breaking out of consolidation, strong ecosystem growth, whale accumulation"
  },
  "weekly_outlook": "Brief outlook for crypto market this week based on current conditions"
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

    return NextResponse.json(parsed);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}