import { NextResponse } from "next/server";
import { connectDB } from "../../../lib/db";
import User from "../../../schema/user";
import { getFedexToken } from "../../../lib/fedex.auth";

export async function POST(req) {
    try {
        await connectDB();

        const body = await req.json().catch(() => ({}));
        console.log("[validate] entry body:", body);
        const { userId } = body || {};

        if (!userId) {
            return NextResponse.json(
                { success: false, error: "userId is required" },
                { status: 400 }
            );
        }

        const user = await User.findById(userId).select("address").lean();

        if (!user) {
            return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
        }

        if (!user.address || !user.address.addressline1) {
            return NextResponse.json(
                { success: false, error: "No saved address found for this user" },
                { status: 400 }
            );
        }

        const addressToValidate = user.address;
        console.log("[validate] address from DB:", JSON.stringify(addressToValidate));

        const token = await getFedexToken();

        const streetLines = [
            addressToValidate.addressline1,
        ].filter(Boolean);

        const payload = {
            validateAddressControlParameters: {
                includeResolutionTokens: true,
            },
            addressesToValidate: [
                {
                    address: {
                        streetLines,
                        city: addressToValidate.city || undefined,
                        stateOrProvinceCode: addressToValidate.state || undefined,
                        postalCode: addressToValidate.zip || undefined,
                        countryCode: addressToValidate.country || "US",
                        residential: true,
                    },
                },
            ],
        };

        const response = await fetch(
            `${process.env.FEDEX_BASE_URL}/address/v1/addresses/resolve`,
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
        console.log("[validate] FedEx raw response:", JSON.stringify(data, null, 2));

        if (!response.ok) {
            return NextResponse.json(
                { success: false, error: "FedEx address validation failed", details: data },
                { status: response.status }
            );
        }

        const resolved = data.output?.resolvedAddresses?.[0];

        if (!resolved) {
            return NextResponse.json(
                { success: false, error: "No resolved address returned", details: data },
                { status: 502 }
            );
        }

        const attributes = resolved.attributes || {};
        const toBool = (v) => v === true || v === "true";

        const isResolved = toBool(attributes.Resolved);
        const isMatched  = toBool(attributes.Matched);
        const isDPV      = toBool(attributes.DPV);

        console.log("[validate] flags →", { isResolved, isMatched, isDPV });

        const isValid = Boolean(isResolved && isMatched && isDPV);
        console.log("[validate] isValid:", isValid);

        const messages = resolved.customerMessages || data.output?.alerts || [];

        return NextResponse.json({
            success: true,
            isValid,
            classification: resolved.classification || "UNKNOWN",
            resolved,
            messages,
        });

    } catch (error) {
        console.error("[validate] unhandled error:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}