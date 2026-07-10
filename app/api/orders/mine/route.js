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

  const sentOrdersRaw = await Order.find({ senderId: user._id })
    .populate("auctionId", "title imageUrl")
    .sort({ createdAt: -1 })
    .lean();

  const receivedOrdersRaw = await Order.find({ receiverId: user._id })
    .populate("auctionId", "title imageUrl")
    .sort({ createdAt: -1 })
    .lean();

  const stripLabel = (o) => {
    const { labelBase64, ...rest } = o;
    return { ...rest, hasLabel: !!labelBase64 };
  };

  const sentOrders = sentOrdersRaw.map(stripLabel);
  const receivedOrders = receivedOrdersRaw.map(stripLabel);

  return Response.json({ sentOrders, receivedOrders });
}