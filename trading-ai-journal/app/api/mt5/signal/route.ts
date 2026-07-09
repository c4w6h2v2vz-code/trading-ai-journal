import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SECRET_KEY = "jama-ftmo-mt5-2026";

export async function GET(request: Request) {
  try {
    const secretKey = request.headers.get("x-mt5-secret");
    if (secretKey !== SECRET_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const account = searchParams.get("account");

    if (!account) {
      return NextResponse.json({});
    }

    const { data: signal } = await supabase
      .from("trade_signals")
      .select("*")
      .eq("account", account)
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    if (!signal) {
      return NextResponse.json({});
    }

    await supabase
      .from("trade_signals")
      .update({ status: "sent" })
      .eq("id", signal.id);

    console.log("Signal sent to MT5:", signal.symbol, signal.trade_type);

    return NextResponse.json({
      symbol: signal.symbol,
      type: signal.trade_type,
      lot: signal.lot_size,
      sl: signal.stop_loss_pips,
      tp: signal.take_profit_pips,
    });
  } catch (error) {
    return NextResponse.json({});
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, account, symbol, trade_type, lot_size, stop_loss_pips, take_profit_pips } = body;

    const { error } = await supabase
      .from("trade_signals")
      .insert([{
        user_id: userId,
        account,
        symbol,
        trade_type,
        lot_size,
        stop_loss_pips,
        take_profit_pips,
        status: "pending",
      }]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}