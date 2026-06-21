import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { connectDB } from "../../../lib/db";
import User from "../../../schema/user";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { address, contact } = body;
  const { addressline1, addressline2, city, state, zip, country } = address || {};

  // Basic server-side guard
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

  // Basic phone format guard (mirrors client-side check)
  if (!/^\+?[0-9\s\-()]{7,20}$/.test(contact.trim())) {
    return Response.json({ message: "Invalid contact number" }, { status: 400 });
  }

  await connectDB();

  const updated = await User.findOneAndUpdate(
    { email: session.user.email },
    {
      $set: {
        address: {
          addressline1: addressline1.trim(),
          addressline2: addressline2?.trim() || "",
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

  return Response.json({ message: "Address saved" }, { status: 200 });
}