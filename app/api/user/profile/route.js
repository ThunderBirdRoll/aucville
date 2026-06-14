import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { connectDB } from "../../../lib/db";
import User from "../../../schema/user";
import Auction from "../../../schema/auction";
import Order from "../../../schema/order";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ message: "Unauthorized" }, { status: 401 });

  await connectDB();

  const user = await User.findOne({ email: session.user.email })
    .select("username email address")
    .lean();

  if (!user) return Response.json({ message: "User not found" }, { status: 404 });

  const now = new Date();

  // ── Auctions the user OWNS ──────────────────────────────────────────────────
  const ownedAuctions = await Auction.find({ owner: user._id })
    .select("title imageUrl category startingPrice currentPrice finalPrice endTime bids isLive")
    .lean();

  const totalOwned  = ownedAuctions.length;
  const liveOwned   = ownedAuctions.filter(a => new Date(a.endTime) > now).length;
  const endedOwned  = ownedAuctions.filter(a => new Date(a.endTime) <= now).length;

  // ── Auctions the user WON (highest bidder + ended) ─────────────────────────
  const endedAuctions = await Auction.find({
    endTime: { $lte: now },
    "bids.bidder": user._id,
  })
    .select("title imageUrl category finalPrice endTime bids")
    .lean();

  const wonAuctions = endedAuctions.filter(auction => {
    if (!auction.bids || auction.bids.length === 0) return false;
    const topBid = auction.bids.reduce((max, b) =>
      b.amount > max.amount ? b : max, auction.bids[0]);
    return String(topBid.bidder) === String(user._id);
  }).map(auction => {
    const myBid = auction.bids
      .filter(b => String(b.bidder) === String(user._id))
      .sort((a, b) => b.amount - a.amount)[0];
    return { ...auction, myWinningAmount: myBid.amount };
  });

  // ── Check which won auctions already have an order placed ──────────────────
  const wonAuctionIds = wonAuctions.map(a => a._id);
  const existingOrders = await Order.find({ auctionId: { $in: wonAuctionIds } })
    .select("auctionId")
    .lean();
  const orderedSet = new Set(existingOrders.map(o => String(o.auctionId)));

  return Response.json({
    user: {
      name: user.username,
      email: user.email,
      address: user.address ?? null,
    },
    stats: { totalOwned, liveOwned, endedOwned },
    ownedAuctions: ownedAuctions.map(a => ({
      _id: a._id,
      title: a.title,
      imageUrl: a.imageUrl,
      category: a.category,
      startingPrice: a.startingPrice,
      currentPrice: a.finalPrice ?? a.startingPrice,
      endTime: a.endTime,
      bidsCount: a.bids?.length ?? 0,
      isLive: new Date(a.endTime) > now,
    })),
    wonAuctions: wonAuctions.map(a => ({
      _id: a._id,
      title: a.title,
      imageUrl: a.imageUrl,
      category: a.category,
      myWinningAmount: a.myWinningAmount,
      endTime: a.endTime,
      orderPlaced: orderedSet.has(String(a._id)),
    })),
  });
}