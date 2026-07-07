import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SECRET_KEY = "jama-ftmo-mt5-2026";

export async function POST(request: Request) {
  try {
    const secretKey = request.headers.get("x-mt5-secret");
    if (secretKey !== SECRET_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    if (body.event === "closed_trade") {
      // Find user by account number
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("mt5_account", body.account)
        .single();

      // If no profile found by account, use the first user (for single user setup)
      let userId = profile?.id;
      if (!userId) {
        const { data: users } = await supabase
          .from("profiles")
          .select("id")
          .limit(1)
          .single();
        userId = users?.id;
      }

      if (!userId) {
        return NextResponse.json({ error: "No user found" }, { status: 404 });
      }

      // Check if trade already exists
      const { data: existing } = await supabase
        .from("mt5_trades")
        .select("id")
        .eq("ticket", body.ticket)
        .single();

      if (existing) {
        return NextResponse.json({ success: true, message: "Trade already exists" });
      }

      // Insert new trade with user_id
      const { data, error } = await supabase
        .from("mt5_trades")
        .insert([{
          user_id: userId,
          ticket: body.ticket,
          account: body.account,
          server: body.server,
          symbol: body.symbol,
          trade_type: body.type,
          lot_size: body.lotSize,
          entry_price: body.entryPrice,
          exit_price: body.exitPrice,
          profit: body.profit,
          open_time: body.openedAt,
          close_time: body.closedAt,
        }])
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, data });
    }

    if (body.event === "loss_limit" || body.event === "profit_target") {
      console.log("Risk Guardian alert:", body.event, body.lossPercent, "%");
      return NextResponse.json({ success: true, message: "Alert received" });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}