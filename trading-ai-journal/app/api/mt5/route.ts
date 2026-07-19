import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SECRET_KEY = "jama-ftmo-mt5-2026";

export async function POST(request: Request) {
  try {
    const secret = request.headers.get("x-mt5-secret");
    if (secret !== SECRET_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const cleanAccount = String(body.account || "").trim();

    // Find which user owns this MT5 account
    const { data: account, error: accountError } = await supabase
      .from("trading_accounts")
      .select("user_id")
      .eq("account_number", cleanAccount)
      .maybeSingle();

    if (accountError) {
      console.error("Account lookup error:", accountError);
      return NextResponse.json({ error: accountError.message }, { status: 500 });
    }

    const userId = account?.user_id;
    if (!userId) {
      return NextResponse.json(
        { error: `Account ${cleanAccount} is not registered in PipTrak. Add it on the Accounts page first.` },
        { status: 404 }
      );
    }

    // Risk Guardian alert — just acknowledge, don't store as a trade
    if (body.event === "loss_limit" || body.event === "profit_target" || body.symbol === "RISK_GUARDIAN") {
      console.log(`Risk Guardian ${body.event} for account ${cleanAccount}: ${body.lossPercent}%`);
      return NextResponse.json({ success: true, message: "Alert received" });
    }

    // Skip if this trade already exists (maybeSingle returns null instead of throwing)
    const { data: existing } = await supabase
      .from("mt5_trades")
      .select("id")
      .eq("ticket", String(body.ticket))
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ success: true, message: "Trade already recorded" });
    }

    const { error: insertError } = await supabase.from("mt5_trades").insert([{
      user_id: userId,
      ticket: String(body.ticket),
      account: cleanAccount,
      server: body.server || "",
      symbol: body.symbol || "",
      trade_type: body.type || "",
      lot_size: Number(body.lotSize) || 0,
      entry_price: Number(body.entryPrice) || 0,
      exit_price: Number(body.exitPrice) || 0,
      profit: Number(body.profit) || 0,
      open_time: body.openedAt || null,
      close_time: body.closedAt || null,
    }]);

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Trade recorded" });
  } catch (error) {
    console.error("MT5 route error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}