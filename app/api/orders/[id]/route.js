// app/api/orders/[id]/route.js
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { connectDB } from "../../../lib/db";
import User from "../../../schema/user";
import Order from "../../../schema/order";
import Auction from "../../../schema/auction";

export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  await connectDB();

  const user = await User.findOne({ email: session.user.email }).lean();
  if (!user) return Response.json({ error: "User not found" }, { status: 404 });

  const order = await Order.findById(id);
  if (!order) return Response.json({ error: "Order not found" }, { status: 404 });

  if (String(order.senderId) !== String(user._id)) {
    return Response.json({ error: "Only the sender can update this order" }, { status: 403 });
  }

  if (body.senderAddress) {
    if (order.status !== "pending") {
      return Response.json({ error: "Address can only be edited while order is pending" }, { status: 400 });
    }
    order.senderAddress = {
      addressline1: body.senderAddress.addressline1 ?? order.senderAddress?.addressline1 ?? "",
      addressline2: body.senderAddress.addressline2 ?? order.senderAddress?.addressline2 ?? "",
      city: body.senderAddress.city ?? order.senderAddress?.city ?? "",
      state: body.senderAddress.state ?? order.senderAddress?.state ?? "",
      zip: body.senderAddress.zip ?? order.senderAddress?.zip ?? "",
      country: body.senderAddress.country ?? order.senderAddress?.country ?? "",
    };
  }

  if (body.status) {
    const allowed = ["pending", "shipped", "delivered"];
    if (!allowed.includes(body.status)) {
      return Response.json({ error: "Invalid status" }, { status: 400 });
    }

    const order_index = allowed.indexOf(order.status);
    const next_index = allowed.indexOf(body.status);

    if (order.status === "delivered") {
      return Response.json({ error: "Delivered orders cannot be changed" }, { status: 400 });
    }

    if (next_index < order_index) {
      return Response.json({ error: "Status cannot be moved backwards" }, { status: 400 });
    }

    order.status = body.status;
  }

  await order.save();
  await order.populate("auctionId", "title imageUrl");

  return Response.json({ success: true, order });
}