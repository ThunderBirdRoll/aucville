// app/api/seller/onboard/route.js
import Stripe from "stripe";
import User from "../../../../schema/user";
import { connectDB } from "../../../../lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
    const { sellerId, email } = await req.json();
    if (!sellerId) {
        return Response.json({ error: "Missing sellerId" }, { status: 400 });
    }
    await connectDB();

    const user = await User.findById(sellerId);
    if (!user) {
        return Response.json({ error: "User not found" }, { status: 404 });
    }

    let stripeAccountId = user.stripeAccountId;

    // Only create a new Stripe account if one doesn't exist yet
    if (!stripeAccountId) {
        const account = await stripe.accounts.create({
            type: "express",
            email,
            country: user.address.country || "US",

            capabilities: {
                transfers: { requested: true },
            },
        },
            { idempotencyKey: `acct-create-${user._id}` }
        );

        stripeAccountId = account.id;

        await User.findByIdAndUpdate(
            sellerId,
            { stripeAccountId },
            { new: true }
        );
    }

    // Generate onboarding link (works for both new and existing accounts)
    const accountLink = await stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL}/seller/onboard/refresh`,
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/seller/onboard/complete`,
        type: "account_onboarding",
    });

    return Response.json({ url: accountLink.url });
}