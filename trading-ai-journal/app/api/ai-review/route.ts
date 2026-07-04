import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { trade, history } = await request.json();
const historyText =
  history && history.length > 0
    ? history
        .map(
          (oldTrade: any, index: number) =>
            `${index + 1}. ${oldTrade.pair} ${oldTrade.direction} | Result: ${oldTrade.result} | P/L: ${oldTrade.profit_loss} | Emotion: ${oldTrade.emotion} | Mistake: ${oldTrade.mistake} | AI Score: ${oldTrade.ai_score}`
        )
        .join("\n")
    : "No previous trade history provided.";
    const rulesText =
      trade.trading_rules && trade.trading_rules.length > 0
        ? trade.trading_rules
            .map(
              (rule: { title: string; description: string }, index: number) =>
                `${index + 1}. ${rule.title}: ${rule.description}`
            )
            .join("\n")
        : "No personal trading rules saved yet.";

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-5.5",
        input: `
You are an elite institutional trading coach.

Your job is to coach this specific trader over months, not just review one trade.

Look for repeated mistakes, improvements, consistency, psychology, execution quality, and whether the trader follows his own trading system.

Always be constructive and specific.

Review this trade using the trader's personal rules.

Personal Trading Rules:
${rulesText}
Recent Trade History:
${historyText}
Trade:
Pair: ${trade.pair}
Direction: ${trade.direction}
Session: ${trade.session}
Strategy: ${trade.strategy}
Result: ${trade.result}
Profit/Loss: ${trade.profit_loss}
Risk Reward: ${trade.risk_reward}
Grade: ${trade.grade}
Emotion: ${trade.emotion}
Mistake: ${trade.mistake}
Notes: ${trade.notes}
Previous Mistakes:
${historyText}

Instructions:
- Check if the trader repeated old mistakes.
- Reward consistency.
- Penalize repeated mistakes.
- Mention any repeated behavior in ai_feedback.
Trading Rules:
${trade.trading_rules || "No personal trading rules found."}
If personal trading rules are provided:

- Check whether the trade followed them.
- Mention any broken rule in the feedback.
- Praise rules that were followed.
- Keep feedback under 3 sentences.
Return only valid JSON:
{
  "ai_score": 85,
  "ai_risk_score": 80,
  "ai_psychology_score": 90,
  "ai_execution_score": 85,
  "ai_feedback": "Mention which personal rules were followed or broken, then give short improvement advice."
}
        `,
      }),
    });

    const data = await response.json();

console.log("OpenAI Status:", response.status);
console.log("OpenAI Response:");
console.log(JSON.stringify(data, null, 2));

if (!response.ok) {
  return NextResponse.json(
    {
      error: "OpenAI request failed",
      details: data,
    },
    { status: response.status }
  );
}

const text =
  data.output_text ||
  data.output?.[0]?.content?.[0]?.text ||
  "";

    const cleaned = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json(parsed);
  } catch (error) {
    return NextResponse.json(
      {
        error: "AI review failed",
        details: String(error),
      },
      { status: 500 }
    );
  }
}