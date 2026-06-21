import { authOptions } from "../../../auth/[...nextauth]/route";
import { connectDB } from "../../../../lib/db";
import Order from "../../../../schema/order";

export async function GET(req, { params }) {

    await connectDB();
    const { id } = await params;


    const order = await Order.findById(id).lean();
    if (!order) {
        return Response.json(
            { error: "Order not found" },
            { status: 404 }
        );
    }
    if (order.status !== "pending_payment") {
        return Response.json(
            { error: "Order is no longer editable" },
            { status: 400 }
        );
    }

    console.log("Fetched order:", order);

    return Response.json({ order });
}