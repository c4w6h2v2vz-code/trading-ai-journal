import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { trade, history, imageBase64 } = body;

    const historyText =
      history && history.length > 0
        ? history.map((t: any, i: number) =>
            `${i + 1}. ${t.pair} ${t.direction} | Result: ${t.result} | P/L: ${t.profit_loss} | Emotion: ${t.emotion} | Mistake: ${t.mistake}`
          ).join("\n")
        : "No previous trade history.";

    const rulesText =
      trade.trading_rules && trade.trading_rules.length > 0
        ? trade.trading_rules.map((r: any, i: number) =>
            `${i + 1}. ${r.title}: ${r.description}`
          ).join("\n")
        : "No personal trading rules saved.";

    const textPrompt = `
You are an elite institutional trading coach reviewing a trader's performance.

Personal Trading Rules:
${rulesText}

Recent Trade History:
${historyText}

Current Trade:
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

Instructions:
- Check if trader repeated old mistakes
- Check if personal rules were followed
- Reward consistency, penalize repeated mistakes
- Keep ai_feedback under 3 sentences
${imageBase64 ? "- A chart screenshot is attached. Analyze the entry quality, market structure, and execution." : ""}

Return only valid JSON:
{
  "ai_score": 85,
  "ai_risk_score": 80,
  "ai_psychology_score": 90,
  "ai_execution_score": 85,
  "ai_feedback": "Specific coaching feedback here."
}
    `;

    const messages: any[] = [];

    if (imageBase64) {
      messages.push({
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`,
            },
          },
          {
            type: "text",
            text: textPrompt,
          },
        ],
      });
    } else {
      messages.push({
        role: "user",
        content: textPrompt,
      });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: "OpenAI request failed", details: data },
        { status: response.status }
      );
    }

    const text = data.choices?.[0]?.message?.content || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in AI response");
    const parsed = JSON.parse(jsonMatch[0]);

    return NextResponse.json(parsed);
  } catch (error) {
    return NextResponse.json(
      { error: "AI review failed", details: String(error) },
      { status: 500 }
    );
  }
}