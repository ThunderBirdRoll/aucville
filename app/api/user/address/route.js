import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { connectDB } from "../../../lib/db";
import User from "../../../schema/user";
import { getFedexToken } from "../../../lib/fedex.auth";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { address, contact } = body;
  console.log("[save-address] body:", body);

  const { addressline1, city, state, zip, country } = address || {};
  // addressline2 intentionally skipped

  if (
    !addressline1?.trim() ||
    !city?.trim() ||
    !state?.trim() ||
    !zip?.trim() ||
    !country ||
    !contact?.trim()
  ) {
    return Response.json({ message: "Missing required fields" }, { status: 400 });
  }

  if (!/^\+?[0-9\s\-()]{7,20}$/.test(contact.trim())) {
    return Response.json({ message: "Invalid contact number" }, { status: 400 });
  }

  await connectDB();

  try {
    // ── STEP 1: validate with FedEx directly (no DB round-trip needed) ──
    const token = await getFedexToken();

    const payload = {
      validateAddressControlParameters: {
        includeResolutionTokens: true,
      },
      addressesToValidate: [
        {
          address: {
            streetLines: [addressline1.trim()],
            city: city.trim(),
            stateOrProvinceCode: state.trim(),
            postalCode: zip.trim(),
            countryCode: country,
            residential: true,
          },
        },
      ],
    };

    const fedexRes = await fetch(
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

    const fedexData = await fedexRes.json();
    console.log("[save-address] FedEx raw response:", JSON.stringify(fedexData, null, 2));

    if (!fedexRes.ok) {
      return Response.json(
        { message: "FedEx validation request failed", details: fedexData },
        { status: fedexRes.status }
      );
    }

    const resolved = fedexData.output?.resolvedAddresses?.[0];

    if (!resolved) {
      return Response.json(
        { message: "No resolved address returned from FedEx", details: fedexData },
        { status: 502 }
      );
    }

    const attributes = resolved.attributes || {};
    const toBool = (v) => v === true || v === "true";

    const isResolved = toBool(attributes.Resolved);
    const isMatched  = toBool(attributes.Matched);
    const isDPV      = toBool(attributes.DPV);
    const isValid    = isResolved && isMatched && isDPV;

    console.log("save-address] flags →[", { isResolved, isMatched, isDPV, isValid });

    if (!isValid) {
      const messages = resolved.customerMessages || fedexData.output?.alerts || [];
      return Response.json(
        { message: "Address could not be verified", details: messages },
        { status: 422 }
      );
    }

    // ── STEP 2: FedEx approved — now save to DB ──
    const updated = await User.findOneAndUpdate(
      { email: session.user.email },
      {
        $set: {
          address: {
            addressline1: addressline1.trim(),
            // addressline2 skipped intentionally
            city: city.trim(),
            state: state.trim(),
            zip: zip.trim(),
            country,
          },
          contact: contact.trim(),
        },
      },
      { new: true }
    );

    if (!updated) {
      return Response.json({ message: "User not found" }, { status: 404 });
    }

    return Response.json({
      message: "Address saved",
      classification: resolved.classification || "UNKNOWN",
    }, { status: 200 });

  } catch (err) {
    console.error("[save-address] error:", err);
    return Response.json({ message: "Something went wrong" }, { status: 500 });
  }
}