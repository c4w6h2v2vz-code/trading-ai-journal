import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const secret = request.headers.get("x-mt5-secret");
    if (secret !== "jama-ftmo-mt5-2026") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const account = searchParams.get("account");

    if (!account) {
      return NextResponse.json({ error: "Account required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("trading_accounts")
      .select("daily_loss_limit_percent, risk_guardian_enabled")
      .eq("account_number", account)
      .maybeSingle();

    if (error) {
      console.error("Settings fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Safe defaults if account not found in PipTrak
    if (!data) {
      return NextResponse.json({
        daily_loss_limit: 3.0,
        risk_guardian_enabled: true,
        found: false,
      });
    }

    return NextResponse.json({
      daily_loss_limit: data.daily_loss_limit_percent ?? 3.0,
      risk_guardian_enabled: data.risk_guardian_enabled ?? true,
      found: true,
    });
  } catch (error) {
    console.error("MT5 settings error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}