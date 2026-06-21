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
  shippingAmount: { type: Number, default: null },
  totalAmount: { type: Number, default: null },
  trackingNumber: { type: String, default: null },
  labelBase64: { type: String, default: null },
  paymentIntentId: String, // store Stripe PaymentIntent ID for later reference
  status: { type: String, enum: ["pending_payment", "paid", "shipped", "delivered", "cancelled"], default: "pending_payment" },
}, { timestamps: true });

export default mongoose.models.Order || mongoose.model("Order", orderSchema);