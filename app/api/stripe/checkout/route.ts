import { NextRequest, NextResponse } from "next/server";
import { stripe, stripeEnabled, STRIPE_PRICES } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  if (!stripeEnabled || !stripe) {
    return NextResponse.json(
      { error: "Payments are not yet configured. Check back soon!" },
      { status: 503 }
    );
  }

  try {
    const { billing, email } = await req.json();
    const priceId = billing === "yearly" ? STRIPE_PRICES.yearly : STRIPE_PRICES.monthly;

    if (!priceId) {
      return NextResponse.json(
        { error: "Pricing not configured. Contact support." },
        { status: 500 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: email || undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${req.nextUrl.origin}/?upgraded=true`,
      cancel_url: `${req.nextUrl.origin}/?canceled=true`,
      metadata: { source: "bedtimevirtues" },
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("[stripe-checkout]", e);
    return NextResponse.json(
      { error: "Failed to create checkout session." },
      { status: 500 }
    );
  }
}
