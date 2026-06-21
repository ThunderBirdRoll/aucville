import { NextRequest, NextResponse } from "next/server";
import Order from "../../../schema/order";
import { connectDB } from "../../../lib/db";

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    await connectDB();
    const { amount, orderId } = await request.json();

    if (!orderId) {
      return Response.json({ error: "orderId is required" }, { status: 400 });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    // ── Get the live shipping rate — never trust a client-sent shipping number ──
    const rateRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/fedex/rate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });
    const rateData = await rateRes.json().catch(() => ({}));

    if (!rateRes.ok || !rateData.success || typeof rateData.price !== "number") {
      return Response.json(
        { error: "Could not calculate shipping cost for this order" },
        { status: 502 }
      );
    }

    const shippingPrice = rateData.price;
    const itemAmount = Number(order.amount);
    const totalAmount = itemAmount + shippingPrice;

    // ── Verify the amount the client thinks it's paying matches our server total ──
    // (Allow a small epsilon for floating point rounding.)
    if (typeof amount === "number" && Math.abs(amount - totalAmount) > 0.01) {
      return Response.json(
        { error: "Amount mismatch", expected: totalAmount, received: amount },
        { status: 400 }
      );
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100),
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: {
        orderId: order._id.toString(),
        sellerId: order.senderId.toString(),
        buyerId: order.receiverId.toString(),
        itemAmount: itemAmount.toFixed(2),
        shippingAmount: shippingPrice.toFixed(2),
      },
    });

    await Order.findByIdAndUpdate(orderId, {
      paymentIntentId: paymentIntent.id,
      shippingAmount: shippingPrice,
      totalAmount,
    });

    return Response.json({
      clientSecret: paymentIntent.client_secret,
      itemAmount,
      shippingAmount: shippingPrice,
      totalAmount,
    });
  } catch (error) {
    console.error("Internal Error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}