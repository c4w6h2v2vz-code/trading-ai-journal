import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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