// app/api/user/me/route.js
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { connectDB } from "../../../lib/db";
import User from "../../../schema/user";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });

    return Response.json({ address: user.address  ?? null , contact:user.contact ?? null });
}