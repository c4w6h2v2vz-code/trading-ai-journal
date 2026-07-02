import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { trades } = await request.json();

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-5.5",
        input: `
You are an elite trading performance coach.

Create a monthly trading report from these trades.

Trades:
${JSON.stringify(trades, null, 2)}

Return only valid JSON:
{
  "overall_grade": "B+",
  "summary": "Short monthly summary.",
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "weaknesses": ["Weakness 1", "Weakness 2", "Weakness 3"],
  "best_pair": "GBPUSD",
  "worst_pair": "EURUSD",
  "main_mistake": "Entering early",
  "coach_advice": "Clear advice for next month."
}
        `,
      }),
    });

    const data = await response.json();

    const text = data.output_text || data.output?.[0]?.content?.[0]?.text || "";
    const cleaned = text.replace(/```json|```/g, "").trim();
    if (!cleaned) {
  throw new Error("AI returned empty response");
}

const jsonStart = cleaned.indexOf("{");
const jsonEnd = cleaned.lastIndexOf("}");

if (jsonStart === -1 || jsonEnd === -1) {
  throw new Error("AI did not return valid JSON: " + cleaned);
}

const jsonText = cleaned.slice(jsonStart, jsonEnd + 1);
const parsed = JSON.parse(jsonText);

    return NextResponse.json(parsed);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Monthly report failed",
        details: String(error),
      },
      { status: 500 }
    );
  }
}