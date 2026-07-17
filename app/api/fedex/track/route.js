// app/api/orders/track/route.js
import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/db";
import Order from "../../../schema/order";
import { getFedexToken } from "../../../lib/fedex.auth";
import { sendEmail } from "../../../lib/sendEmail";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PLATFORM_FEE_PERCENT = 7; // platform keeps 7%
const MIN_DAYS = 12;
const MAX_DAYS = 17;

async function payoutPickupScheduledOrders() {
    await connectDB();

    const now = Date.now();
 
    const minCutoff = new Date(now - MAX_DAYS * 24 * 60 * 60 * 1000); 
    const maxCutoff = new Date(now - MIN_DAYS * 24 * 60 * 60 * 1000); 

   
    const orders = await Order.find({
        status: "pickup_scheduled",
        createdAt: { $gte: minCutoff, $lte: maxCutoff },
        stripeTransferId: null, 
    }).populate("senderId"); zz

    const results = [];

    for (const order of orders) {
        try {
            const seller = order.senderId;

            if (!seller || !seller.stripeAccountId || !seller.stripeOnboardingDone) {
                console.warn(`Skipping order ${order._id}: seller not ready for payouts`);
                results.push({ orderId: order._id, status: "skipped_no_seller_account" });
                continue;
            }

            if (!order.amount || order.amount <= 0) {
                console.warn(`Skipping order ${order._id}: invalid amount`);
                results.push({ orderId: order._id, status: "skipped_invalid_amount" });
                continue;
            }

            // 2. compute seller payout: amount minus 7% platform fee
            // Work in integer cents and floor (round down) so we never round up
            // in the seller's favor and never hit floating-point rounding errors.
            const orderAmountCents = Math.floor(order.amount * 100);
            const sellerShareCents = Math.floor(
                orderAmountCents * (1 - PLATFORM_FEE_PERCENT / 100)
            );
            const sellerShare = sellerShareCents / 100; // dollars, floored to the cent

            // 3. create the transfer to seller's connected account
            const transfer = await stripe.transfers.create({
                amount: sellerShareCents,
                currency: "usd",
                destination: seller.stripeAccountId,
                transfer_group: order._id.toString(),
                metadata: {
                    orderId: order._id.toString(),
                    sellerId: seller._id.toString(),
                    sellerName: seller.username || seller.email || "Unknown",
                },
            },
                {
                    idempotencyKey: `payout_${order._id.toString()}`,
                });

            // 4. update order: mark delivered + paid, store transfer id for reference
            order.status = "delivered";
            order.sellerPaidAt = new Date();
            order.stripeTransferId = transfer.id;
            order.sellerPayoutAmount = sellerShare;
            await order.save();

            results.push({ orderId: order._id, status: "paid", transferId: transfer.id });

            try {
                await sendEmail({
                    to: process.env.EMAIL_USER,
                    subject: `💰 Seller Payout Completed - Order #${order._id}`,
                    html: `
      <h2>Seller Payout Successful ✅</h2>

      <p><strong>Order ID:</strong> ${order._id}</p>
      <p><strong>Seller:</strong> ${seller.username || seller.email}</p>
      <p><strong>Seller Email:</strong> ${seller.email}</p>

      <hr>

      <p><strong>Order Amount:</strong> $${order.amount.toFixed(2)}</p>
      <p><strong>Platform Fee:</strong> ${PLATFORM_FEE_PERCENT}%</p>
      <p><strong>Seller Received:</strong> $${sellerShare.toFixed(2)}</p>

      <hr>

      <p><strong>Stripe Transfer ID:</strong> ${transfer.id}</p>
      <p><strong>Paid At:</strong> ${new Date().toLocaleString()}</p>

      <p style="color:green">
        This payout was processed successfully by the scheduled cron job.
      </p>
    `,
                });
            } catch (emailErr) {
                console.error("Failed to send payout email:", emailErr);
            }


        } catch (err) {
            console.error(`Failed to pay out order ${order._id}:`, err.message);
            results.push({ orderId: order._id, status: "failed", error: err.message });
        }
    }

    return results;
}

export async function GET(request) {
    try {
        const results = await payoutPickupScheduledOrders();
        return NextResponse.json({ success: true, results });
    } catch (err) {
        console.error("payoutPickupScheduledOrders failed:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}




//    fedex track later implement
// export async function POST(req) {
//     try {
//         const { orderId } = await req.json();
//         console.log("[track] ── START ──────────────────────────────");
//         console.log("[track] orderId:", orderId);

//         if (!orderId) {
//             return NextResponse.json(
//                 { success: false, error: "orderId is required" },
//                 { status: 400 }
//             );
//         }

//         await connectDB();

//         // GET ORDER
//         const order = await Order.findById(orderId);
//         console.log("[track] order:", order ? JSON.stringify({
//             _id: order._id,
//             status: order.status,
//             trackingNumber: order.trackingNumber,
//         }, null, 2) : "NOT FOUND");

//         if (!order) {
//             return NextResponse.json(
//                 { success: false, error: "Order not found" },
//                 { status: 404 }
//             );
//         }

//         if (!order.trackingNumber) {
//             console.log("[track] ❌ no trackingNumber on order");
//             return NextResponse.json(
//                 { success: false, error: "No tracking number assigned to this order yet" },
//                 { status: 422 }
//             );
//         }

//         // GET FEDEX TOKEN
//         console.log("[track] fetching FedEx token...");
//         console.log("[track] FEDEX_BASE_URL:", process.env.FEDEX_BASE_URL);
//         console.log("[track] FEDEX_CLIENT_ID:", process.env.FEDEX_CLIENT_ID?.slice(0, 6) + "...");
//         const token = await getFedexToken();
//         console.log("[track] token:", token ? token.slice(0, 20) + "..." : "❌ NULL");

//         if (!token) {
//             console.error("[track] ❌ no FedEx token — check FEDEX_CLIENT_ID / FEDEX_CLIENT_SECRET / FEDEX_BASE_URL");
//             return NextResponse.json(
//                 { success: false, error: "Failed to authenticate with FedEx" },
//                 { status: 500 }
//             );
//         }

//         // BUILD PAYLOAD — Track by Tracking Number (NOT MPS)
//         const payload = {
//             includeDetailedScans: true,
//             trackingInfo: [
//                 {
//                     trackingNumberInfo: {
//                         trackingNumber: order.trackingNumber,
//                     },
//                 },
//             ],
//         };
//         console.log("[track] request payload:", JSON.stringify(payload, null, 2));
//         console.log("[track] hitting URL:", `${process.env.FEDEX_BASE_URL}/track/v1/trackingnumbers`);

//         // CALL FEDEX TRACK API
//         const response = await fetch(
//             `${process.env.FEDEX_BASE_URL}/track/v1/trackingnumbers`,
//             {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/json",
//                     Authorization: `Bearer ${token}`,
//                     "X-locale": "en_US",
//                 },
//                 body: JSON.stringify(payload),
//             }
//         );

//         console.log("[track] FedEx HTTP status:", response.status, response.statusText);

//         const data = await response.json();
//         console.log("[track] FedEx full response:", JSON.stringify(data, null, 2));

//         if (!response.ok) {
//             console.error("[track] ❌ FedEx track failed");
//             return NextResponse.json(
//                 { success: false, error: "FedEx track failed", details: data },
//                 { status: response.status }
//             );
//         }

//         const result = data?.output?.completeTrackResults?.[0]?.trackResults?.[0];
//         console.log("[track] result extracted:", result ? "✅" : "❌ empty");
//         console.log("[track] latestStatusDetail:", JSON.stringify(result?.latestStatusDetail, null, 2));
//         console.log("[track] scanEvents count:", result?.scanEvents?.length ?? 0);
//         console.log("[track] dateAndTimes:", JSON.stringify(result?.dateAndTimes, null, 2));

//         if (!result) {
//             return NextResponse.json(
//                 { success: false, error: "No tracking data returned from FedEx" },
//                 { status: 502 }
//             );
//         }

//         // ── FedEx uses "scanEvents" per their API docs ──
//         const scanEvents = result.scanEvents ?? [];
//         const latestEvent = scanEvents[0];

//         // UPDATE ORDER STATUS
//         const fedexStatusCode = result.latestStatusDetail?.code;
//         console.log("[track] fedexStatusCode:", fedexStatusCode);

//         // Extend this map as needed — FedEx has many more codes
//         // (RS = returned to shipper, CA = cancelled, SE = shipment exception, DE = delivery exception, etc.)
//         const statusMap = {
//             DL: "delivered",
//             IT: "shipped",
//             PU: "pickup_scheduled",
//             OC: "labelled",
//         };

//         const newStatus = statusMap[fedexStatusCode];
//         console.log("[track] newStatus:", newStatus ?? "no mapping — keeping: " + order.status);

//         if (newStatus && order.status !== newStatus) {
//             await Order.findByIdAndUpdate(orderId, { status: newStatus });
//             console.log(`[track] ✅ order status updated: ${order.status} → ${newStatus}`);
//         }

//         // ESTIMATED DELIVERY
//         const estimatedDeliveryEntry = result.dateAndTimes?.find(
//             (d) => d.type === "ESTIMATED_DELIVERY"
//         );
//         const estimatedDelivery =
//             estimatedDeliveryEntry?.dateTime ??
//             result.estimatedDeliveryTimeWindow?.window?.ends ??
//             result.standardTransitTimeWindow?.window?.ends ??
//             null;
//         console.log("[track] estimatedDelivery:", estimatedDelivery);

//         // ACTUAL DELIVERY
//         const actualDeliveryEntry = result.dateAndTimes?.find(
//             (d) => d.type === "ACTUAL_DELIVERY"
//         );
//         const actualDelivery = actualDeliveryEntry?.dateTime ?? null;
//         console.log("[track] actualDelivery:", actualDelivery);
//         console.log("[track] ── END ────────────────────────────────");

//         return NextResponse.json({
//             success: true,
//             trackingNumber: order.trackingNumber,
//             orderStatus: newStatus ?? order.status,
//             fedexStatus: result.latestStatusDetail?.statusByLocale ?? null,
//             fedexStatusCode: fedexStatusCode ?? null,
//             fedexStatusDescription: result.latestStatusDetail?.description ?? null,
//             estimatedDelivery,
//             actualDelivery,
//             latestEvent: latestEvent
//                 ? {
//                     description: latestEvent.eventDescription,
//                     derivedStatus: latestEvent.derivedStatus,
//                     timestamp: latestEvent.date,
//                     location: [
//                         latestEvent.scanLocation?.city,
//                         latestEvent.scanLocation?.stateOrProvinceCode,
//                         latestEvent.scanLocation?.countryCode,
//                     ]
//                         .filter(Boolean)
//                         .join(", "),
//                     exceptionDescription: latestEvent.exceptionDescription ?? null,
//                     delayDetail: latestEvent.delayDetail ?? null,
//                 }
//                 : null,
//             events: scanEvents.map((e) => ({
//                 description: e.eventDescription,
//                 derivedStatus: e.derivedStatus,
//                 timestamp: e.date,
//                 location: [
//                     e.scanLocation?.city,
//                     e.scanLocation?.stateOrProvinceCode,
//                     e.scanLocation?.countryCode,
//                 ]
//                     .filter(Boolean)
//                     .join(", "),
//                 exceptionDescription: e.exceptionDescription ?? null,
//                 delayDetail: e.delayDetail ?? null,
//             })),
//         });

//     } catch (error) {
//         console.error("[track] ❌ unhandled error:", error.message);
//         console.error("[track] stack:", error.stack);
//         return NextResponse.json(
//             { success: false, error: error.message },
//             { status: 500 }
//         );
//     }
// }