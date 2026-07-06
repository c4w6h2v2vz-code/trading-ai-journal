import { NextResponse } from "next/server";
import Stripe from "stripe";

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-06-24.dahlia",
});

export async function POST(request: Request) {
  try {
    const { priceId, userId, email } = await request.json();

    const stripe = getStripe();
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
console.log("Checkout session created:", session.id, session.url);
    return NextResponse.json({ url: session.url });
    
  } catch (error) {
    console.error("Stripe error:", error);
    return NextResponse.json(
      { error: String(error), details: JSON.stringify(error) },
      { status: 500 }
    );
  }
}