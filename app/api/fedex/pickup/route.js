import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/db";
import Order from "../../../schema/order";
import User from "../../../schema/user";
import { getFedexToken } from "../../../lib/fedex.auth";
import { toFedExReadyTimestamp } from "../../../lib/shipDate";
import { sendEmail } from "../../../lib/sendEmail"

export async function POST(req) {
    try {
        const { orderId } = await req.json();

        if (!orderId) {
            return NextResponse.json(
                { success: false, error: "orderId is required" },
                { status: 400 }
            );
        }

        await connectDB();

        const order = await Order.findById(orderId);
        if (!order) {
            return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
        }
        if (order.status !== "labelled") {
            return NextResponse.json(
                { success: false, error: `Order status is "${order.status}". Run ship route first.` },
                { status: 400 }
            );
        }
        if (!order.trackingNumber) {
            return NextResponse.json(
                { success: false, error: "No tracking number. Run ship route first." },
                { status: 400 }
            );
        }

        const sender = await User.findById(order.senderId);
        if (!sender) {
            return NextResponse.json({ success: false, error: "Sender not found" }, { status: 404 });
        }

        const token = await getFedexToken();

        const readyTime = new Date(order.scheduledShipDate);
        const readyTimestamp = toFedExReadyTimestamp(readyTime);

        // ── PAYLOAD — matched exactly to official FedEx Ground sample ──────────
        const payload = {
            associatedAccountNumber: {
                value: process.env.FEDEX_ACCOUNT_NUMBER,
            },

            originDetail: {
                pickupLocation: {
                    contact: {
                        personName: sender.username,
                        phoneNumber: sender.contact
                    },
                    address: {
                        streetLines: [
                            order.senderAddress.addressline1
                        ].filter(Boolean),
                        city: order.senderAddress.city,
                        stateOrProvinceCode: order.senderAddress.state,
                        postalCode: order.senderAddress.zip,
                        countryCode: order.senderAddress.country || "US",
                        // residential: true
                    },
                },
                packageLocation: "FRONT",
                readyDateTimestamp: readyTimestamp,
                customerCloseTime: "20:00:00",
            },

            carrierCode: "FDXG"
        };

        console.log("FedEx pickup payload:\n", JSON.stringify(payload, null, 2));

        const response = await fetch(
            `${process.env.FEDEX_BASE_URL}/pickup/v1/pickups`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                    "X-locale": "en_US",
                },
                body: JSON.stringify(payload),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("FedEx pickup error:\n", JSON.stringify(data, null, 2));
            return NextResponse.json(
                { success: false, error: "FedEx pickup scheduling failed", details: data },
                { status: response.status }
            );
        }

        const pickupConfirmationCode = data?.output?.pickupConfirmationCode ?? null;
        const location = data?.output?.location ?? null;

        if (!pickupConfirmationCode) {
            return NextResponse.json(
                { success: false, error: "FedEx did not return a pickup confirmation", details: data?.output ?? data },
                { status: 502 }
            );
        }

        await Order.findByIdAndUpdate(orderId, {
            status: "pickup_scheduled",
            pickupConfirmationCode,
            pickupLocation: location,
            pickupScheduledAt: new Date(),
            pickupReadyAt: readyTime,
        });

        // ── SEND EMAIL TO SENDER ─────────────────────────────────────────────
        // Don't let an email failure break the pickup response — log & continue.
        try {
            if (sender.email) {
                const formattedReadyTime = readyTime.toLocaleString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                });

                const addressLine = [
                    order.senderAddress.addressline1,
                    order.senderAddress.city,
                    order.senderAddress.state,
                    order.senderAddress.zip,
                ].filter(Boolean).join(", ");

                await sendEmail({
                    to: sender.email,
                    subject: `FedEx Pickup Scheduled — Confirmation #${pickupConfirmationCode}`,
                    html: buildPickupEmailHtml({
                        senderName: sender.username,
                        pickupConfirmationCode,
                        formattedReadyTime,
                        addressLine,
                        trackingNumber: order.trackingNumber,
                        location,
                    }),
                });
            } else {
                console.warn("Sender has no email on file; skipping pickup notification.");
            }
        } catch (emailErr) {
            console.error("Failed to send pickup confirmation email:", emailErr.message);
        }

        return NextResponse.json({
            success: true,
            pickupConfirmationCode,
            location,
            readyTime: readyTimestamp,
            message: "FedEx pickup scheduled for next business day.",
        });

    } catch (error) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// ── EMAIL TEMPLATE ──────────────────────────────────────────────────────────
function buildPickupEmailHtml({
    senderName,
    pickupConfirmationCode,
    formattedReadyTime,
    addressLine,
    trackingNumber,
    location,
}) {
    return `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f4f4f7; padding: 24px;">
      <div style="background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">

        <div style="background-color: #4d148c; padding: 20px 24px;">
          <h1 style="color: #ffffff; font-size: 20px; margin: 0;">Aucville</h1>
        </div>

        <div style="padding: 24px;">
          <h2 style="color: #111827; font-size: 18px; margin-top: 0;">Your FedEx Pickup is Scheduled ✅</h2>

          <p style="color: #374151; font-size: 15px; line-height: 1.6;">
            Hi ${senderName || "there"},
          </p>

          <p style="color: #374151; font-size: 15px; line-height: 1.6;">
            Good news — your FedEx pickup has been scheduled. Please have your package
            ready at the pickup location <strong>before the courier arrives</strong>.
          </p>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; width: 40%;">Confirmation Code</td>
              <td style="padding: 8px 0; color: #111827; font-weight: 600;">${pickupConfirmationCode}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Tracking Number</td>
              <td style="padding: 8px 0; color: #111827; font-weight: 600;">${trackingNumber}</td>
            </tr>
             <tr>
               <td style="padding: 8px 0; color: #6b7280;">Pickup Ready Time</td>
               <td style="padding: 8px 0; color: #111827; font-weight: 600;">${formattedReadyTime}  This can be changed by the courier. </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Pickup Address</td>
              <td style="padding: 8px 0; color: #111827; font-weight: 600;">${addressLine}</td>
            </tr>
            ${location ? `
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Pickup Location</td>
              <td style="padding: 8px 0; color: #111827; font-weight: 600;">${location}</td>
            </tr>` : ""}
          </table>

          <div style="background-color: #fff7e6; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              ⏰ The courier may arrive anytime  on the pickup day.
              Please make sure your package is ready and accessible at the front of the location.
            </p>
          </div>

          <p style="color: #374151; font-size: 15px; line-height: 1.6;">
            Thanks for shipping with Aucville!
          </p>
        </div>

        <div style="background-color: #f9fafb; padding: 16px 24px; text-align: center;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            This is an automated message from Aucville. Please don't reply directly to this email.
          </p>
        </div>

      </div>
    </div>
  `;
}






