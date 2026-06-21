import { NextResponse } from "next/server";

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    // Get payId from request body
    const { payId } = await request.json();

    // Validate input
    if (!payId) {
      return NextResponse.json(
        { success: false, message: "Payment ID is required" },
        { status: 400 }
      );
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(payId);

    // Return payment details
    return NextResponse.json({
      success: true,
      paymentstatus: paymentIntent.status,
      metadata: paymentIntent.metadata,
    });

  } catch (error) {
    console.error("Stripe Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Something went wrong",
      },
      { status: 500 }
    );
  }
}




