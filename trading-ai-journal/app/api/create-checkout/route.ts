import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { priceId, userId, email } = await request.json();
console.log("Key exists:", !!process.env.STRIPE_SECRET_KEY);
    console.log("Key starts with:", process.env.STRIPE_SECRET_KEY?.substring(0, 10));
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
      apiVersion: "2026-06-24.dahlia",
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: email,
      metadata: {
        userId,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe error:", error);
    return NextResponse.json(
      { error: String(error), details: "C" },
      { status: 500 }
    );
  }
}