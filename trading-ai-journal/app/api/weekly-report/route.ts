import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  try {
    const { user_id } = await request.json();

    const supabase = createClient(supabaseUrl, supabaseKey);

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);

    const { data: trades } = await supabase
      .from("trades")
      .select("*")
      .eq("user_id", user_id)
      .gte("created_at", startOfWeek.toISOString())
      .order("created_at", { ascending: false });

    const tradeList = trades || [];
    const wins = tradeList.filter(t => t.result === "Win");
    const losses = tradeList.filter(t => t.result === "Loss");
    const totalPL = tradeList.reduce((sum: number, t: { profit_loss: number }) => sum + Number(t.profit_loss), 0);
    const winRate = tradeList.length > 0 ? ((wins.length / tradeList.length) * 100).toFixed(1) : "0";
    const mistakes = tradeList.map((t: { mistake: string }) => t.mistake).filter(Boolean);
    const emotions = tradeList.map((t: { emotion: string }) => t.emotion).filter(Boolean);

    const summary = {
      totalTrades: tradeList.length,
      wins: wins.length,
      losses: losses.length,
      winRate,
      totalPL: totalPL.toFixed(2),
      mistakes,
      emotions,
      recentTrades: tradeList.slice(0, 5).map((t: { pair: string; result: string; profit_loss: number; emotion: string; mistake: string }) => ({
        pair: t.pair,
        result: t.result,
        pl: t.profit_loss,
        emotion: t.emotion,
        mistake: t.mistake,
      })),
    };

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
          content: `You are an elite trading coach. Write a professional weekly trading report for this trader. Include: performance summary, what went well, what needs improvement, psychology analysis, and specific goals for next week. Be direct, honest and actionable. Use clear sections. Data: ${JSON.stringify(summary)}`,
        }],
      }),
    });

    const data = await response.json();
    const report = data.choices?.[0]?.message?.content || "Could not generate report.";

    return NextResponse.json({ report, summary });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}