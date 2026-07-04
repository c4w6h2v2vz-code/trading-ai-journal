import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: Request) {
  try {
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Missing Supabase environment variables" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { trade } = await request.json();

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
            role: "user",
            content: `
You are an elite trading coach. Review this MT5 trade.

Return only valid JSON with no extra text.

Trade:
Symbol: ${trade.symbol}
Type: ${trade.trade_type}
Lot size: ${trade.lot_size}
Entry: ${trade.entry_price}
Exit: ${trade.exit_price}
Profit/Loss: ${trade.profit}
Account: ${trade.account}
Server: ${trade.server}

Return this exact JSON:
{
  "ai_score": 85,
  "ai_risk_score": 80,
  "ai_psychology_score": 75,
  "ai_execution_score": 90,
  "ai_feedback": "Short useful coaching feedback under 3 sentences."
}
            `,
          },
        ],
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
if (!jsonMatch) throw new Error("No JSON found in AI response");
const parsed = JSON.parse(jsonMatch[0]);

    const { error } = await supabase
      .from("mt5_trades")
      .update({
        ai_score: parsed.ai_score,
        ai_risk_score: parsed.ai_risk_score,
        ai_psychology_score: parsed.ai_psychology_score,
        ai_execution_score: parsed.ai_execution_score,
        ai_feedback: parsed.ai_feedback,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", trade.id);

    if (error) {
      return NextResponse.json(
        { error: "Failed to save MT5 AI review", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(parsed);
  } catch (error) {
    return NextResponse.json(
      { error: "MT5 AI review failed", details: String(error) },
      { status: 500 }
    );
  }
}