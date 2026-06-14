// app/api/orders/place/route.js
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { connectDB } from "../../../lib/db";
import User from "../../../schema/user";
import Auction from "../../../schema/auction";
import Order from "../../../schema/order";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { auctionId } = await req.json();
  if (!auctionId) return Response.json({ error: "Auction ID required" }, { status: 400 });

  await connectDB();

  const buyer = await User.findOne({ email: session.user.email }).lean();
  if (!buyer) return Response.json({ error: "User not found" }, { status: 404 });

  const hasAddress = buyer.address &&
    (buyer.address.addressline1 || buyer.address.city);
  if (!hasAddress) {
    return Response.json({ error: "No shipping address set" }, { status: 400 });
  }

  const auction = await Auction.findById(auctionId);
  if (!auction) return Response.json({ error: "Auction not found" }, { status: 404 });

  const existingOrder = await Order.findOne({ auctionId });
  if (existingOrder) {
    return Response.json({ error: "Order already placed for this auction" }, { status: 409 });
  }

  auction.buyer = buyer._id;
  await auction.save();

  const sender = await User.findById(auction.owner).lean();
  if (!sender) return Response.json({ error: "Auction owner not found" }, { status: 404 });

  const order = await Order.create({
    auctionId: auction._id,
    receiverId: buyer._id,
    senderId: sender._id,
    receiverAddress: {
      addressline1: buyer.address?.addressline1 ?? "",
      addressline2: buyer.address?.addressline2 ?? "",
      city: buyer.address?.city ?? "",
      state: buyer.address?.state ?? "",
      zip: buyer.address?.zip ?? "",
      country: buyer.address?.country ?? "",
    },
    senderAddress: {
      addressline1: sender.address?.addressline1 ?? "",
      addressline2: sender.address?.addressline2 ?? "",
      city: sender.address?.city ?? "",
      state: sender.address?.state ?? "",
      zip: sender.address?.zip ?? "",
      country: sender.address?.country ?? "",
    },
    amount: auction.finalPrice ?? auction.startingPrice,
    status: "pending",
  });

  return Response.json({ success: true, order });
}