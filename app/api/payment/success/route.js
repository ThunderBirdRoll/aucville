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
    // If this order was already marked paid/shipped (e.g. webhook + client both
    // fired, or the user double-submitted), don't re-ship or re-email.
    if (order.status === "paid") {
      return Response.json({
        success: true,
        message: "Order already processed",
        alreadyProcessed: true,
      });
    }

    // Update order status
    order.status = "paid";
    await order.save();
    console.log("done paid order")

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

      console.log("shipp", shipData);

      if (!shipRes.ok || !shipData.success) {
        throw new Error(shipData.error || "FedEx shipment creation failed");
      }

      shipment = shipData; // { trackingNumber, labelBase64, sender, receiver, serviceType, shipDate }

      // NOTE: /api/fedex/ship already persists status:"shipped", trackingNumber,
      // and labelBase64 on the order via its own findByIdAndUpdate — don't
      // duplicate that DB write here, just mirror it locally for the emails below.
      order.trackingNumber = shipment.trackingNumber;
      order.status = "labelled";
    } catch (err) {
      shipError = err.message || "Could not create shipment";
      console.error("FedEx ship error:", shipError);
      // We deliberately do NOT throw here — payment already succeeded.
      // The order stays at status "paid" so it can be retried/shipped manually.
    }

    /*
      EMAIL TO BUYER
    */

    await sendEmail({
      to: buyer.email,
      subject: "Your Purchase is Confirmed 🎉",
      html: `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f4f4f7; padding: 24px;">
      <div style="background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">

        <div style="background-color: #4d148c; padding: 20px 24px;">
          <h1 style="color: #ffffff; font-size: 20px; margin: 0;">Aucville</h1>
        </div>

        <div style="padding: 24px;">
          <h2 style="color: #111827; font-size: 18px; margin-top: 0;">Payment Successful ✅</h2>

          <p style="color: #374151; font-size: 15px; line-height: 1.6;">
            Hi ${buyer.name || "there"},
          </p>

          <p style="color: #374151; font-size: 15px; line-height: 1.6;">
            Thank you for your purchase! We've successfully received your payment.
            Here are your order details:
          </p>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; width: 40%;">Item</td>
              <td style="padding: 8px 0; color: #111827; font-weight: 600;">${itemTitle}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Amount Paid</td>
              <td style="padding: 8px 0; color: #111827; font-weight: 600;">$${order.amount}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Order ID</td>
              <td style="padding: 8px 0; color: #111827; font-weight: 600;">${order._id}</td>
            </tr>
            ${shipment ? `
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Tracking Number</td>
              <td style="padding: 8px 0; color: #111827; font-weight: 600;">${shipment.trackingNumber}</td>
            </tr>` : ""}
          </table>

          <div style="background-color: ${shipment ? "#ecfdf5" : "#fff7e6"}; border-left: 4px solid ${shipment ? "#10b981" : "#f59e0b"}; padding: 12px 16px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0; color: ${shipment ? "#065f46" : "#92400e"}; font-size: 14px;">
              ${shipment
          ? "📦 Your order has shipped and is on its way!"
          : "⏳ The seller has been notified and will prepare your shipment shortly."}
            </p>
          </div>

          <p style="color: #374151; font-size: 15px; line-height: 1.6;">
            Thank you for shopping with Aucville!
          </p>
        </div>

        <div style="background-color: #f9fafb; padding: 16px 24px; text-align: center;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            This is an automated message from Aucville. Please don't reply directly to this email.
          </p>
        </div>

      </div>
    </div>
  `,
    });
    /*
      EMAIL TO SELLER (with shipping label PDF attached, if shipment succeeded)
    */

    /*
   EMAIL TO SELLER (with shipping label PDF attached, if shipment succeeded)
 */

    const sellerEmailPayload = {
      to: seller.email,
      subject: shipment ? "Item Sold — Shipping Label Attached 📦" : "Your Item Has Been Sold 🎉",
      html: `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f4f4f7; padding: 24px;">
      <div style="background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">

        <div style="background-color: #4d148c; padding: 20px 24px;">
          <h1 style="color: #ffffff; font-size: 20px; margin: 0;">Aucville</h1>
        </div>

        <div style="padding: 24px;">
          <h2 style="color: #111827; font-size: 18px; margin-top: 0;">Congratulations 🎉</h2>

          <p style="color: #374151; font-size: 15px; line-height: 1.6;">
            Hi ${seller.name || "there"},
          </p>

          <p style="color: #374151; font-size: 15px; line-height: 1.6;">
            Good news — your auction listing has been purchased successfully.
            Here are the order details:
          </p>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; width: 40%;">Item Sold</td>
              <td style="padding: 8px 0; color: #111827; font-weight: 600;">${itemTitle}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Sale Amount</td>
              <td style="padding: 8px 0; color: #111827; font-weight: 600;">$${order.amount}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Order ID</td>
              <td style="padding: 8px 0; color: #111827; font-weight: 600;">${order._id}</td>
            </tr>
            ${shipment ? `
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Tracking Number</td>
              <td style="padding: 8px 0; color: #111827; font-weight: 600;">${shipment.trackingNumber}</td>
            </tr>` : ""}
          </table>

          <div style="background-color: ${shipment ? "#ecfdf5" : "#fff7e6"}; border-left: 4px solid ${shipment ? "#10b981" : "#f59e0b"}; padding: 12px 16px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0; color: ${shipment ? "#065f46" : "#92400e"}; font-size: 14px;">
              ${shipment
          ? "📎 Your FedEx shipping label is attached as a PDF. Print it, attach it to the package, and drop it off or schedule a pickup."
          : "⚠️ Automatic label generation failed. Please create the shipping label manually or contact support, then update the order once dispatched."}
            </p>
          </div>

          <p style="color: #374151; font-size: 15px; line-height: 1.6;">
            The buyer has completed payment successfully — thanks for selling with Aucville!
          </p>
        </div>

        <div style="background-color: #f9fafb; padding: 16px 24px; text-align: center;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            This is an automated message from Aucville. Please don't reply directly to this email.
          </p>
        </div>

      </div>
    </div>
  `,
    };





    if (shipment?.labelBase64) {
      sellerEmailPayload.attachments = [
        {
          filename: `shipping-label-${shipment.trackingNumber}.pdf`,
          content: Buffer.from(shipment.labelBase64, "base64"),
          contentType: "application/pdf",
        },
      ];
    }

    await sendEmail(sellerEmailPayload);

  try {
  const pickupRes = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/fedex/pickup`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    }
  );

 

  const pickupData = await pickupRes.json();

  console.log("Pickup Response:", pickupData);

  if (!pickupData.success) {
    throw new Error(
      pickupData.error || "FedEx pickup creation failed"
    );
  }

  return pickupData;
} catch (error) {
  console.error("FedEx Pickup Error:", error);

  throw new Error(
    error.message || "FedEx pickup creation failed"
  );
}


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