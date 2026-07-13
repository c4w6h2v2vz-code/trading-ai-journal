import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, email, subject, message } = body;

    if (!email || !subject || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { error } = await supabase
      .from("support_tickets")
      .insert([{ user_id: userId || null, email, subject, message }]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Also try to email admin via Resend if configured (best effort, non-blocking)
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "PipTrak Support <noreply@piptrak.com>",
          to: "support@piptrak.com",
          reply_to: email,
          subject: `New support ticket: ${subject}`,
          text: `From: ${email}\n\n${message}`,
        }),
      });
    } catch (emailErr) {
      console.error("Support email notify failed:", emailErr);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}