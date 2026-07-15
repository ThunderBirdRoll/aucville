import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/db";
import Order from "../../../schema/order";
import Auction from "../../../schema/auction";
import User from "../../../schema/user";
import { getFedexToken } from "../../../lib/fedex.auth";
import { getNextBusinessDay, toFedExDateOnly } from "../../../lib/shipDate"


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

        // GET ORDER
        const order = await Order.findById(orderId);
        if (!order) return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
        if (order.status !== "paid") {
            return NextResponse.json(
                { success: false, error: `Cannot ship order with status "${order.status}"` },
                { status: 400 }
            );
        }

        // GET SENDER (seller)
        const sender = await User.findById(order.senderId);
        if (!sender) return NextResponse.json({ success: false, error: "Sender not found" }, { status: 404 });

        // GET RECEIVER (buyer)
        const receiver = await User.findById(order.receiverId);
        if (!receiver) return NextResponse.json({ success: false, error: "Receiver not found" }, { status: 404 });

        // GET AUCTION (package details)
        const auction = await Auction.findById(order.auctionId);
        if (!auction) return NextResponse.json({ success: false, error: "Auction not found" }, { status: 404 });

        const pkg = auction.packageDetails;

        // GET FEDEX TOKEN
        const token = await getFedexToken();
        const shipDate = getNextBusinessDay();

        // BUILD PAYLOAD
        const payload = {
            accountNumber: {
                value: process.env.FEDEX_ACCOUNT_NUMBER,
            },
            labelResponseOptions: "LABEL",
            requestedShipment: {

                // ✅ SENDER DOOR - FedEx picks up from seller's address
                shipper: {
                    contact: {
                        personName: sender.username,
                        phoneNumber: sender.contact,
                        companyName: "Auction Seller",
                    },
                    address: {
                        streetLines: [order.senderAddress.addressline1],
                        city: order.senderAddress.city,
                        stateOrProvinceCode: order.senderAddress.state,
                        postalCode: order.senderAddress.zip,
                        countryCode: order.senderAddress.country || "US",
                    },
                },

                // ✅ RECEIVER DOOR - FedEx delivers to buyer's home
                recipients: [
                    {
                        contact: {
                            personName: receiver.username,
                            phoneNumber: receiver.contact,
                            companyName: "Auction Buyer",
                        },
                        address: {
                            streetLines: [order.receiverAddress.addressline1],
                            city: order.receiverAddress.city,
                            stateOrProvinceCode: order.receiverAddress.state,
                            postalCode: order.receiverAddress.zip,
                            countryCode: order.receiverAddress.country || "US",
                            residential: true, // ✅ home delivery to buyer's door
                        },
                    },
                ],

                serviceType: "GROUND_HOME_DELIVERY",        // ✅ delivers to buyer's home door
                pickupType: "CONTACT_FEDEX_TO_SCHEDULE",    // ✅ FedEx picks up from seller's door
                packagingType: "YOUR_PACKAGING",
               shipDatestamp: toFedExDateOnly(shipDate),
                totalWeight: pkg.weight,
                totalPackageCount: 1,

                // ✅ PLATFORM PAYS
                shippingChargesPayment: {
                    paymentType: "SENDER",
                    payor: {
                        responsibleParty: {
                            accountNumber: {
                                value: process.env.FEDEX_ACCOUNT_NUMBER,
                            },
                        },
                    },
                },

                labelSpecification: {
                    labelFormatType: "COMMON2D",
                    imageType: "PDF",
                    labelStockType: "PAPER_4X6",
                },

                // ✅ PACKAGE from auction
                requestedPackageLineItems: [
                    {
                        sequenceNumber: 1,
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
        };

        // CALL FEDEX
        const response = await fetch(
            `${process.env.FEDEX_BASE_URL}/ship/v1/shipments`,
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
            console.log("shipp", JSON.stringify(data, null, 2));
            return NextResponse.json(
                
                { success: false, error: "FedEx ship failed", details: data },

                { status: response.status }
            );
        }


        const transactionShipment = data?.output?.transactionShipments?.[0];

        if (!transactionShipment) {
            return NextResponse.json(
                {
                    success: false,
                    error: "FedEx returned an unexpected response shape",
                    alerts: data?.output?.alerts ?? null,
                    details: data,
                },
                { status: 502 }
            );
        }

        const shipment = transactionShipment;
        const trackingNumber = shipment?.masterTrackingNumber ?? null;
        const pieceResponse = shipment?.pieceResponses?.[0];
        const labelDoc = pieceResponse?.packageDocuments?.[0];

        if (!trackingNumber) {
            return NextResponse.json(
                { success: false, error: "FedEx did not return a tracking number", details: shipment },
                { status: 502 }
            );
        }

        if (!labelDoc?.encodedLabel) {
            return NextResponse.json(
                {
                    success: false,
                    error: "FedEx did not return a label",
                    alerts: shipment?.alerts ?? null,
                    details: pieceResponse ?? shipment,
                },
                { status: 502 }
            );
        }


        // FedEx returns the label as base64 PDF bytes, not a hosted URL
        const labelBase64 = labelDoc.encodedLabel;

        // UPDATE ORDER IN DB — store the label so it can be re-fetched later
        await Order.findByIdAndUpdate(orderId, {
            status: "labelled",
            trackingNumber,
            labelBase64,
            scheduledShipDate: shipDate,
        },
            { returnDocument: "after" }
        );

        return NextResponse.json({
            success: true,
            trackingNumber,
            labelBase64,    // ✅ frontend decodes this into a PDF blob to download/print
            sender: sender.username,
            receiver: receiver.username,
            serviceType: shipment.serviceType,
            shipDate: shipment.shipDatestamp,
        });

    } catch (error) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}