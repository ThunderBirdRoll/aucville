import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { connectDB } from "../../../../lib/db";
import User from "../../../../schema/user";
import Order from "../../../../schema/order";
import mongoose from "mongoose";

export async function GET(req, { params }) {

   let id = await params;
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const user = await User.findOne({ email: session.user.email }).lean();
  if (!user) return Response.json({ error: "User not found" }, { status: 404 });
  id = new mongoose.Types.ObjectId(id);
  const order = await Order.findById(id).lean();
  if (!order) return Response.json({ error: "Order not found" }, { status: 404 });

  // Only the seller (sender) can download their own label
  if (String(order.senderId) !== String(user._id)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!order.labelBase64) {
    return Response.json({ error: "Label not generated yet" }, { status: 404 });
  }

  const pdfBuffer = Buffer.from(order.labelBase64, "base64");

  return new Response(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="shipping-label-${order._id}.pdf"`,
    },
  });
}