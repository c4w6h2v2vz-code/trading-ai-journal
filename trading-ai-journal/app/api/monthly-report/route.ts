import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { trades } = await request.json();

    if (!trades || trades.length === 0) {
      return NextResponse.json({
        overall_grade: "N/A",
        summary: "No trades found yet.",
        strengths: [],
        weaknesses: [],
        best_pair: "N/A",
        worst_pair: "N/A",
        main_mistake: "N/A",
        coach_advice: "Add trades first to generate a report.",
      });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: `
Return ONLY valid JSON.

Create a monthly trading report from these trades:

${JSON.stringify(trades, null, 2)}

JSON format:
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

    if (!response.ok) {
      throw new Error(data.error?.message || "OpenAI request failed");
    }

    const text =
      data.output_text ||
      data.output?.[0]?.content?.[0]?.text ||
      "";

    if (!text) {
      throw new Error(JSON.stringify(data));
    }

    const cleaned = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

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