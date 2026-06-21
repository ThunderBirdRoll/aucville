import Order from "../../../schema/order";
import User from "../../../schema/user";
import Auction from "../../../schema/auction";
import { connectDB } from "../../../lib/db";
import { sendEmail } from "../../../lib/sendEmail";

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    await connectDB();

    const { paymentIntentId, orderId } = await req.json();

    // Verify payment with Stripe
    const payment = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (payment.status !== "succeeded") {
      return Response.json(
        { error: "Payment not completed" },
        { status: 400 }
      );
    }

    // Get order first
    const order = await Order.findById(orderId);

    if (!order) {
      return Response.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // ── Idempotency guard ──
    if (order.status === "paid" || order.status === "shipped") {
      return Response.json({
        success: true,
        message: "Order already processed",
        alreadyProcessed: true,
      });
    }

    // Update order status
    order.status = "paid";
    await order.save();

    // Get buyer + seller + auction
    const buyer = await User.findById(order.receiverId);
    const seller = await User.findById(order.senderId);
    const auction = await Auction.findById(order.auctionId);

    const itemTitle = auction?.title || "Auction Item";

    // ── Create the FedEx shipment now that payment has cleared ──
    let shipment = null;
    let shipError = null;

    try {
      const shipRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/fedex/ship`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const shipData = await shipRes.json().catch(() => ({}));

      if (!shipRes.ok || !shipData.success) {
        throw new Error(shipData.error || "FedEx shipment creation failed");
      }

      shipment = shipData;

      order.trackingNumber = shipment.trackingNumber;
      order.status = "shipped";
    } catch (err) {
      shipError = err.message || "Could not create shipment";
      console.error("FedEx ship error:", shipError);
    }

    // DEBUG: log exactly what we got back from the ship step, before building emails
    console.log("DEBUG shipment object:", {
      hasShipment: !!shipment,
      shipError,
      hasLabelBase64: !!shipment?.labelBase64,
      labelBase64Type: typeof shipment?.labelBase64,
      labelBase64Length: shipment?.labelBase64?.length,
      labelBase64First30: shipment?.labelBase64?.slice(0, 30),
    });

    /*
      EMAIL TO BUYER
    */

    await sendEmail({
      to: buyer.email,
      subject: "Purchase Confirmation",
      html: `
        <div style="font-family: Arial, sans-serif; line-height:1.6">
          <h2>Payment Successful ✅</h2>
          <p>Hello ${buyer.name || "Customer"},</p>
          <p>Thank you for your purchase.</p>
          <p>Your payment has been successfully received for the item:</p>
          <div style="padding:12px; background:#f5f5f5; border-radius:8px;">
            <strong>Item:</strong> ${itemTitle}<br/>
            <strong>Amount Paid:</strong> $${order.amount}<br/>
            <strong>Order ID:</strong> ${order._id}
            ${shipment ? `<br/><strong>Tracking Number:</strong> ${shipment.trackingNumber}` : ""}
          </div>
          <p>${shipment
            ? "Your order has shipped and is on its way."
            : "The seller will now prepare shipment for your order."}</p>
          <p>Thank you for using our marketplace.</p>
          <br/>
          <p>Best Regards,<br/>Marketplace Team</p>
        </div>
      `,
    });

    /*
      EMAIL TO SELLER (with shipping label PDF attached, if shipment succeeded)
    */

    const sellerEmailPayload = {
      to: seller.email,
      subject: shipment ? "Item Sold — Shipping Label Attached" : "Your Item Has Been Sold",
      html: `
        <div style="font-family: Arial, sans-serif; line-height:1.6">
          <h2>Congratulations 🎉</h2>
          <p>Hello ${seller.name || "Seller"},</p>
          <p>Good news — your auction listing has been purchased successfully.</p>
          <div style="padding:12px; background:#f5f5f5; border-radius:8px;">
            <strong>Item Sold:</strong> ${itemTitle}<br/>
            <strong>Sale Amount:</strong> $${order.amount}<br/>
            <strong>Order ID:</strong> ${order._id}
            ${shipment ? `<br/><strong>Tracking Number:</strong> ${shipment.trackingNumber}` : ""}
          </div>
          ${shipment
            ? `<p>Your FedEx shipping label is attached as a PDF. Print it, attach it to the package, and drop it off or schedule a pickup.</p>`
            : `<p>Please prepare the item for shipment and update the order once dispatched. (Note: automatic label generation failed — please create the label manually or contact support.)</p>`
          }
          <p>The buyer has completed payment successfully.</p>
          <br/>
          <p>Best Regards,<br/>Marketplace Team</p>
        </div>
      `,
    };

    if (shipment?.labelBase64) {
      const labelBuffer = Buffer.from(shipment.labelBase64, "base64");

      // DEBUG: verify the decoded buffer actually looks like a real PDF
      console.log("DEBUG label buffer:", {
        bufferByteLength: labelBuffer.length,
        first5BytesAsString: labelBuffer.slice(0, 5).toString(),
        looksLikeRealPDF: labelBuffer.slice(0, 5).toString() === "%PDF-",
      });

      sellerEmailPayload.attachments = [
        {
          filename: `shipping-label-${shipment.trackingNumber}.pdf`,
          content: labelBuffer,
          contentType: "application/pdf",
        },
      ];
    } else {
      console.log("DEBUG: no labelBase64 present, skipping attachment entirely");
    }

    console.log("DEBUG: sellerEmailPayload has attachments?", !!sellerEmailPayload.attachments);

    await sendEmail(sellerEmailPayload);

    return Response.json({
      success: true,
      message: "Payment verified, shipment created, and emails sent",
      shipment: shipment
        ? { trackingNumber: shipment.trackingNumber, serviceType: shipment.serviceType }
        : null,
      shipError,
    });

  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}