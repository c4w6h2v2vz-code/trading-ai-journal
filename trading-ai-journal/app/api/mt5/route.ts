import { NextResponse } from "next/server";

let latestMT5Data: any = null;

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

    latestMT5Data = {
      ...data,
      receivedAt: new Date().toISOString(),
    };

    console.log("MT5 data received:", latestMT5Data);

    return NextResponse.json({
      success: true,
      message: "MT5 data received successfully",
      data: latestMT5Data,
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
  return NextResponse.json({
    success: true,
    connected: latestMT5Data !== null,
    data: latestMT5Data,
  });
}