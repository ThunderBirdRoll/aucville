// app/api/seller/onboard/complete/route.js
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../auth/[...nextauth]/route";
import { connectDB } from "../../../../../lib/db";
import User from "../../../../../schema/user";



import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST() {
  const session = await getServerSession(authOptions);

  await connectDB();

  const user = await User.findById(session.user.id);

  const account = await stripe.accounts.retrieve(
    user.stripeAccountId
  );

  if (
    account.details_submitted &&
    account.payouts_enabled
  ) {
    await User.findByIdAndUpdate(
      session.user.id,
      { stripeOnboardingDone: true }
    );

    return Response.json({ success: true });
  }

  return Response.json({ success: false });
}
