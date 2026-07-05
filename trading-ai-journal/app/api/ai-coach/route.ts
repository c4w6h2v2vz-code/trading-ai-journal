import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

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
          content: `You are an elite trading coach. Analyze this trader's psychology and give specific, honest, actionable coaching advice in 3-4 paragraphs. Be direct and personal. Data: ${JSON.stringify(body)}`,
        }],
      }),
    });

    const data = await response.json();
    
    console.log("OpenAI status:", response.status);
    console.log("OpenAI response:", JSON.stringify(data));

    if (!response.ok) {
      return NextResponse.json({ report: `OpenAI error: ${data.error?.message || "Unknown error"}` });
    }

    const text = data.choices?.[0]?.message?.content || "Could not generate report.";
    return NextResponse.json({ report: text });
  } catch (error) {
    console.error("AI coach error:", error);
    return NextResponse.json({ report: "Error: " + String(error) });
  }
}