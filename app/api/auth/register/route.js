import { connectDB } from "../../../lib/db";
import User from "../../../schema/user";
import bcrypt from "bcryptjs";

export async function POST(req) {
  await connectDB();

  const { username, email, password } = await req.json();

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return Response.json({ message: "User already exists" }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    username,
    email,
    password: hashedPassword,
    address: null
  });

  return Response.json({ message: "User created", user });
}