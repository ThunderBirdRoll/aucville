// lib/auth.js
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import User from "../schema/user";
import { connectDB } from "./db";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: {},
        password: {}
      },

      async authorize(credentials) {
        await connectDB();

        const user = await User.findOne({
          email: credentials.email
        });

        if (!user) {
          throw new Error("No user found");
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isValid) {
          throw new Error("Wrong password");
        }

        return user;
      }
    })
  ],

  session: {
    strategy: "jwt"
  },

  secret: process.env.NEXTAUTH_SECRET
};