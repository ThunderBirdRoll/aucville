// app/api/auction/[id]/bid/route.js
import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/db";
import Auction from "../../../../schema/auction";

export async function POST(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const { amount, userId } = body;

    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ message: "Invalid bid amount" }, { status: 400 });
    }

    const auction = await Auction.findById(id);
    if (!auction) {
      return NextResponse.json({ message: "Auction not found" }, { status: 404 });
    }

    const now = new Date();
    if (new Date(auction.endTime) <= now) {
      return NextResponse.json({ message: "Auction has ended" }, { status: 400 });
    }

    const currentPrice = auction.finalPrice ?? auction.startingPrice;
    if (amount <= currentPrice) {
      return NextResponse.json({
        message: `Bid must be greater than current price ($${currentPrice})`,
      }, { status: 400 });
    }

    // push bid + update finalPrice
    auction.bids.push({ bidder: userId || null, amount });
    auction.finalPrice = amount;
    await auction.save();

    return NextResponse.json({
      message: "Bid placed successfully",
      finalPrice: auction.finalPrice,
      bidsCount: auction.bids.length,
    });
  } catch (err) {
    console.error("POST /api/auction/[id]/bid error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}