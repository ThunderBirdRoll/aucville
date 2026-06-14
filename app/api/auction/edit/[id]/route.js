// app/api/auction/edit/[id]/route.js
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { connectDB } from "../../../../lib/db";
import User from "../../../../schema/user";
import Auction from "../../../../schema/auction";

const EDITABLE_FIELDS = ["title", "startingPrice", "endTime", "category"];

export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  await connectDB();

  const user = await User.findOne({ email: session.user.email }).lean();
  if (!user) return Response.json({ error: "User not found" }, { status: 404 });

  const auction = await Auction.findById(id);
  if (!auction) return Response.json({ error: "Auction not found" }, { status: 404 });

  if (String(auction.owner) !== String(user._id)) {
    return Response.json({ error: "Only the owner can edit this auction" }, { status: 403 });
  }

  if (new Date(auction.endTime) <= new Date()) {
    return Response.json({ error: "This auction has already ended and cannot be edited" }, { status: 400 });
  }

  if (body.title !== undefined) {
    const title = String(body.title).trim();
    if (!title) return Response.json({ error: "Title cannot be empty" }, { status: 400 });
    if (title.length > 200) return Response.json({ error: "Title is too long" }, { status: 400 });
    auction.title = title;
  }

  if (body.category !== undefined) {
    const category = String(body.category).trim();
    if (!category) return Response.json({ error: "Category cannot be empty" }, { status: 400 });
    auction.category = category;
  }

  if (body.startingPrice !== undefined) {
    const startingPrice = Number(body.startingPrice);
    if (isNaN(startingPrice) || startingPrice < 1) {
      return Response.json({ error: "Starting price must be at least 1" }, { status: 400 });
    }
    auction.startingPrice = startingPrice;
  }

  if (body.endTime !== undefined) {
    const endTime = new Date(body.endTime);
    if (isNaN(endTime.getTime())) {
      return Response.json({ error: "Invalid end time" }, { status: 400 });
    }
    if (endTime <= new Date()) {
      return Response.json({ error: "End time must be in the future" }, { status: 400 });
    }
    auction.endTime = endTime;
  }

  await auction.save();

  return Response.json({ success: true, auction });
}