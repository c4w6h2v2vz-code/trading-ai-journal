import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const trade = await request.json();

    console.log("MT5 trade received:", trade);

    return NextResponse.json({
      success: true,
      message: "MT5 trade received successfully",
      trade,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "MT5 trade import failed",
        details: String(error),
      },
      { status: 500 }
    );
  }
}