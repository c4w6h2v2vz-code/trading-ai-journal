import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { events } = await request.json();

    const eventsText = events.map((e: any) =>
      `${e.time} - ${e.currency} - ${e.event} - Impact: ${e.impact} - Forecast: ${e.forecast} - Previous: ${e.previous}`
    ).join("\n");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{
          role: "user",
          content: `You are an elite institutional forex analyst with 20 years of experience.

Today's economic events:
${eventsText}

For each HIGH impact event, analyze:
1. Based on the last 10 years of historical data for this event, what typically happens to the related currency pairs?
2. If forecast beats previous → what direction does the market usually move and by how many pips?
3. If forecast misses → what direction?
4. Give a percentage probability for each direction
5. Suggest a trade plan if the setup is good

Also give an overall market bias for today for these pairs: EURUSD, GBPUSD, XAUUSD, USDJPY

Return a JSON response like this:
{
  "overall_bias": {
    "EURUSD": { "direction": "Bullish", "confidence": 65, "reason": "ECB hawkish + USD weak" },
    "GBPUSD": { "direction": "Bearish", "confidence": 55, "reason": "UK data disappointing" },
    "XAUUSD": { "direction": "Bullish", "confidence": 70, "reason": "Risk off sentiment" },
    "USDJPY": { "direction": "Bearish", "confidence": 60, "reason": "BOJ intervention risk" }
  },
  "event_analysis": [
    {
      "event": "NFP",
      "currency": "USD",
      "if_beats": { "direction": "USD Strong", "probability": 72, "avg_pips": 80, "pairs_affected": ["EURUSD down", "GBPUSD down"] },
      "if_misses": { "direction": "USD Weak", "probability": 68, "avg_pips": 60, "pairs_affected": ["EURUSD up", "GBPUSD up"] },
      "trade_plan": "Wait 5 minutes after release. If beats → Sell EURUSD. If misses → Buy EURUSD. SL 30 pips, TP 60 pips.",
      "historical_note": "NFP has beaten forecast 58% of times in last 10 years. Average EURUSD move: 85 pips."
    }
  ],
  "warning": "High volatility expected today. Reduce position size by 50%.",
  "best_pairs_to_trade": ["XAUUSD", "EURUSD"],
  "pairs_to_avoid": ["USDJPY"]
}`,
        }],
      }),
    });

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");
    const parsed = JSON.parse(jsonMatch[0]);

    return NextResponse.json(parsed);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}