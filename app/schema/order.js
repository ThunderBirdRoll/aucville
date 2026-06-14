// app/schema/order.js
import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  auctionId: { type: mongoose.Schema.Types.ObjectId, ref: "Auction", required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiverAddress: {
    addressline1: String,
    addressline2: String,
    city: String,
    state: String,
    zip: String,
    country: String,
  },
  senderAddress: {
    addressline1: String,
    addressline2: String,
    city: String,
    state: String,
    zip: String,
    country: String,
  },
  amount: Number,
  status: { type: String, enum: ["pending", "shipped", "delivered", "cancelled"], default: "pending" },
}, { timestamps: true });

export default mongoose.models.Order || mongoose.model("Order", orderSchema);