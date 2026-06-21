import { connectDB } from "../../../lib/db";
import Order from "../../../schema/order";
import User from "../../../schema/user";
import { sendEmail } from "../../../lib/sendEmail";

// TEST ROUTE — just resends the seller email + label PDF for an existing order.
// Does NOT touch Stripe or FedEx. Use this to debug email delivery in isolation.
//
// Usage: POST /api/test/send-label-email   body: { "orderId": "..." }

export async function POST(req) {
  try {
    await connectDB();

    const { orderId } = await req.json();

    if (!orderId) {
      return Response.json({ error: "orderId is required" }, { status: 400 });
    }

    // 1. Get the order
    const order = await Order.findById(orderId);
    if (!order) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    console.log("DEBUG order found:", {
      orderId: order._id.toString(),
      status: order.status,
      hasLabelBase64: !!order.labelBase64,
      labelBase64Length: order.labelBase64?.length,
      trackingNumber: order.trackingNumber,
      senderId: order.senderId?.toString(),
    });

    if (!order.labelBase64) {
      return Response.json(
        { error: "This order has no labelBase64 saved yet — ship it first." },
        { status: 400 }
      );
    }

    // 2. Get the seller (sender) by senderId
    const seller = await User.findById(order.senderId);
    if (!seller) {
      return Response.json({ error: "Seller (sender) not found" }, { status: 404 });
    }

    console.log("DEBUG seller found:", {
      sellerId: seller._id.toString(),
      sellerEmail: seller.email,
      sellerUsername: seller.username,
    });

    if (!seller.email) {
      return Response.json({ error: "Seller has no email on file" }, { status: 400 });
    }

    // 3. Decode the stored label into a real PDF buffer
    const labelBuffer = Buffer.from(order.labelBase64, "base64");

    console.log("DEBUG label buffer:", {
      bufferByteLength: labelBuffer.length,
      first5BytesAsString: labelBuffer.slice(0, 5).toString(),
      looksLikeRealPDF: labelBuffer.slice(0, 5).toString() === "%PDF-",
    });

    // 4. Build + send the test email
    const payload = {
      to: seller.email,
      subject: "[TEST] Shipping Label Resend",
      html: `
        <div style="font-family: Arial, sans-serif; line-height:1.6">
          <h2>Test Email</h2>
          <p>This is a test resend of the shipping label PDF for order <strong>${order._id}</strong>.</p>
          <p><strong>Tracking Number:</strong> ${order.trackingNumber || "N/A"}</p>
          <p>If you can see a PDF attached to this email, the email+attachment pipeline is working correctly.</p>
        </div>
      `,
      attachments: [
        {
          filename: `TEST-shipping-label-${order.trackingNumber || order._id}.pdf`,
          content: labelBuffer,
          contentType: "application/pdf",
        },
      ],
    };

    console.log("DEBUG: about to call sendEmail with payload to:", payload.to);

    const result = await sendEmail(payload);

    console.log("DEBUG: sendEmail returned:", result);

    return Response.json({
      success: true,
      message: `Test email sent to ${seller.email}`,
      trackingNumber: order.trackingNumber,
      result,
    });

  } catch (error) {
    console.error("TEST ROUTE ERROR:", error);
    return Response.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}