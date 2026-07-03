import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const secret = request.headers.get("x-mt5-secret");

    if (secret !== process.env.MT5_SECRET_KEY) {
      return NextResponse.json(
        { success: false, error: "Unauthorized MT5 request" },
        { status: 401 }
      );
    }

    const data = await request.json();

    const { error } = await supabase.from("mt5_connection").insert({
      account: data.account,
      server: data.server,
      balance: data.balance,
      equity: data.equity,
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: "MT5 data saved successfully",
      data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "MT5 data import failed",
        details: String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  const { data, error } = await supabase
    .from("mt5_connection")
    .select("*")
    .order("received_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return NextResponse.json({
      success: true,
      connected: false,
      data: null,
    });
  }

  return NextResponse.json({
    success: true,
    connected: true,
    data: {
      account: data.account,
      server: data.server,
      balance: data.balance,
      equity: data.equity,
      receivedAt: data.received_at,
    },
  });
}