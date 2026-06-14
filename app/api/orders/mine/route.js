// app/api/orders/mine/route.js
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { connectDB } from "../../../lib/db";
import User from "../../../schema/user";
import Order from "../../../schema/order";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const user = await User.findOne({ email: session.user.email }).lean();
  if (!user) return Response.json({ error: "User not found" }, { status: 404 });

  const sentOrders = await Order.find({ senderId: user._id })
    .populate("auctionId", "title imageUrl")
    .sort({ createdAt: -1 })
    .lean();

  const receivedOrders = await Order.find({ receiverId: user._id })
    .populate("auctionId", "title imageUrl")
    .sort({ createdAt: -1 })
    .lean();

  return Response.json({ sentOrders, receivedOrders });
}