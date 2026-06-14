import { connectDB } from "../../../lib/db";
import Auction from "../../../schema/auction";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    console.log("Received request to create auction");

    await connectDB();

    const body = await req.json();

    // matches your frontend body
    const {
      title,
      imageUrl,
      startingPrice,
      category,
      endTime,
     packageDetails,
     owner,
    } = body;


    console.log("Parsed request body",body);    // validation
    if (
      !title?.trim() ||
      !imageUrl ||
      startingPrice == null ||
      !category ||
      !endTime ||
      !packageDetails
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields",
        },
        { status: 400 }
      );
    }

    const { weight, length, width, height } = packageDetails;

    if (
      weight == null ||
      length == null ||
      width == null ||
      height == null
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Package details incomplete",
        },
        { status: 400 }
      );
    }

    const auction = await Auction.create({
      // remove this if owner required=false
      // otherwise replace with logged-in user id
      owner,

      title: title.trim(),
      imageUrl,

      // schema field names
      startingPrice: Number(startingPrice),
      category,
      endTime,

      packageDetails: {
        weight: Number(weight),
        length: Number(length),
        width: Number(width),
        height: Number(height),
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Auction created successfully",
        data: auction,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Server error",
      },
      { status: 500 }
    );
  }
}