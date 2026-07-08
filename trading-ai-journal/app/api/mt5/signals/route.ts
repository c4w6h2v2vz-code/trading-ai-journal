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

    // Get pending signal for this account
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

    // Mark signal as sent
    await supabase
      .from("trade_signals")
      .update({ status: "sent" })
      .eq("id", signal.id);

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