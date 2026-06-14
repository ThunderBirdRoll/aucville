// app/api/auctions/route.js
import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/db";
import Auction from "../../../schema/auction";

const PAGE_SIZE = 12;

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const search   = searchParams.get("search")   || "";
    const category = searchParams.get("category") || "";
    const page     = Math.max(1, parseInt(searchParams.get("page") || "1", 10));

    const now = new Date();

    // ── Filtered query ──
    const query = {};
    if (search)   query.title    = { $regex: search, $options: "i" };
    if (category) query.category = category;

    const total    = await Auction.countDocuments(query);
    const auctions = await Auction.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean();

    // ── Stats from ALL auctions ──
    const allAuctions = await Auction.find({}).lean();

    const liveCount     = allAuctions.filter(a => new Date(a.endTime) > now).length;
    const categoryCount = new Set(allAuctions.map(a => a.category)).size;
    const prices        = allAuctions.map(a => a.finalPrice || a.startingPrice).filter(Boolean);
    const avgPrice      = prices.length
      ? Math.round(prices.reduce((s, p) => s + p, 0) / prices.length)
      : 0;

    // ── Tag isLive ──
    const tagged = auctions.map(a => ({
      ...a,
      isLive: new Date(a.endTime) > now,
    }));

    return NextResponse.json({
      auctions: tagged,
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        total,
        totalPages: Math.ceil(total / PAGE_SIZE),
      },
      stats: { liveCount, categoryCount, avgPrice },
    });
  } catch (err) {
    console.error("GET /api/auctions error:", err);
    return NextResponse.json({ error: "Failed to fetch auctions" }, { status: 500 });
  }
}