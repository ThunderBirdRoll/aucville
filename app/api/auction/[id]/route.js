// app/api/auction/[id]/route.js
import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/db";
import Auction from "../../../schema/auction";

export async function GET(request, { params }) {
  try {
    console.log("params:", params);
    await connectDB();
    const { id } = await params;

    const auction = await Auction.findById(id).lean();
    if (!auction) {
      return NextResponse.json({ message: "Auction not found" }, { status: 404 });
    }

    const now = new Date();
    const isLive = new Date(auction.endTime) > now;

    return NextResponse.json({
      auction: {
        ...auction,
        isLive,
        currentPrice: auction.finalPrice ?? auction.startingPrice,
      },
    });
  } catch (err) {
    console.error("GET /api/auction/[id] error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}