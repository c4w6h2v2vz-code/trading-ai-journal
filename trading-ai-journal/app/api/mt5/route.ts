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
      // Find which user owns this MT5 account number
      const { data: account, error: accountError } = await supabase
        .from("trading_accounts")
        .select("user_id")
        .eq("account_number", String(body.account))
        .maybeSingle();

      if (accountError) {
        console.error("Account lookup error:", accountError);
        return NextResponse.json({ error: accountError.message }, { status: 500 });
      }

      const userId = account?.user_id;

      if (!userId) {
        console.error("No PipTrak account found for MT5 account:", body.account);
        return NextResponse.json(
          { error: `Account ${body.account} is not registered in PipTrak. Add it on the Accounts page first.` },
          { status: 404 }
        );
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