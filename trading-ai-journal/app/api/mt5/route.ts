import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(url, key);
}

export async function POST(request: Request) {
  try {
    const secret = request.headers.get("x-mt5-secret");

    if (secret !== process.env.MT5_SECRET_KEY) {
      return NextResponse.json(
        { success: false, error: "Unauthorized MT5 request" },
        { status: 401 }
      );
    }

    const supabase = getSupabase();
    const data = await request.json();

    await supabase.from("mt5_connection").insert({
      account: data.account,
      server: data.server,
      balance: data.balance,
      equity: data.equity,
    });

    if (data.ticket) {
      const { error } = await supabase.from("mt5_trades").upsert({
        ticket: String(data.ticket),
        account: data.account,
        server: data.server,
        symbol: data.symbol,
        trade_type: data.type,
        lot_size: data.lotSize,
        entry_price: data.entryPrice,
        exit_price: data.exitPrice,
        stop_loss: data.stopLoss,
        take_profit: data.takeProfit,
        profit: data.profit,
        opened_at: data.openedAt,
        closed_at: data.closedAt,
      });

      if (error) throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
  return NextResponse.json(
    {
      success: false,
      error: error?.message || String(error),
      details: error,
    },
    { status: 500 }
  );
}
}

export async function GET() {
  try {
    const supabase = getSupabase();

    const { data } = await supabase
      .from("mt5_connection")
      .select("*")
      .order("received_at", { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({
      success: true,
      connected: !!data,
      data,
    });
  } catch {
    return NextResponse.json({
      success: true,
      connected: false,
      data: null,
    });
  }
}