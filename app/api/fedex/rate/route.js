import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/db"
import Order from "../../../schema/order";
import Auction from "../../../schema/auction";
import { getFedexToken } from "../../../lib/fedex.auth";


// ----------------------------
// POST ROUTE
// ----------------------------
export async function POST(req) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "orderId is required" },
        { status: 400 }
      );
    }

    // ----------------------------
    // GET ORDER
    // ----------------------------
    await connectDB();
    const order = await Order.findById(orderId);

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // ----------------------------
    // GET AUCTION (package details)
    // ----------------------------
    const auction = await Auction.findById(order.auctionId);

    if (!auction) {
      return NextResponse.json(
        { success: false, error: "Auction not found" },
        { status: 404 }
      );
    }

    const pkg = auction.packageDetails;

    console.log("pakagess", pkg);

    // ----------------------------
    // GET FEDEX TOKEN
    // ----------------------------
    const token = await getFedexToken();

    console.log("token", token);

    // ----------------------------
    // BUILD FEDEX PAYLOAD
    // ----------------------------
    const payload = {
      accountNumber: {
        value: process.env.FEDEX_ACCOUNT_NUMBER,
      },

      rateRequestControlParameters: {
        returnTransitTimes: false, // ✅ no transit info = smaller response
        rateSortOrder: "SERVICENAMETRADITIONAL",
      },

      requestedShipment: {
        shipper: {
          address: {
            postalCode: order.receiverAddress.zip,
            countryCode: order.senderAddress.country || "US",
          },
        },

        recipient: {
          address: {
            postalCode: order.senderAddress.zip,
            countryCode: order.receiverAddress.country || "US",
            residential: true
          },
        },

        pickupType: "CONTACT_FEDEX_TO_SCHEDULE",
        packagingType: "YOUR_PACKAGING",  // ✅ required field - fixes the error

        rateRequestType: ["LIST"],

        shipDateStamp: new Date().toISOString().split("T")[0],

        requestedPackageLineItems: [
          {
            weight: {
              units: "LB",
              value: pkg.weight,
            },
            dimensions: {
              length: Math.round(pkg.length),
              width: Math.round(pkg.width),
              height: Math.round(pkg.height),
              units: "IN",
            },
          },
        ],
      },

      carrierCodes: ["FDXG"],  // ✅ moved to root level
    };

    // ----------------------------
    // CALL FEDEX API
    // ----------------------------
    const response = await fetch(
      `${process.env.FEDEX_BASE_URL}/rate/v1/rates/quotes`,
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

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          success: false,
          error: "FedEx rate request failed",
          details: errorData,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    const rate = data.output.rateReplyDetails[0];
    const price = rate.ratedShipmentDetails[0].totalNetCharge;

    return NextResponse.json({
      success: true,
      price,          // e.g. 12.50
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}