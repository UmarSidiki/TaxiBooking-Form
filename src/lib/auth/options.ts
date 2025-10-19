import { MongoDBAdapter } from "@auth/mongodb-adapter"
import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcryptjs"

import clientPromise from "@/lib/mongodb"
import { connectDB } from "@/lib/mongoose"
import Driver from "@/models/Driver"

const DEFAULT_ROLE = "admin"

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise, {
    databaseName: process.env.MONGODB_DB,
  }),
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("NextAuth authorize called with credentials:", { email: credentials?.email, password: "[REDACTED]" });
        if (!credentials?.email || !credentials?.password) {
          console.log("Missing email or password");
          throw new Error("Email and password are required")
        }

        await connectDB();
        const email = credentials.email.trim().toLowerCase()
        console.log("Normalized email:", email);

        // First check if it's an admin user (we'll need to create a User model or use direct MongoDB for this)
        // For now, skip admin check and focus on drivers

        // Check drivers collection using mongoose
        const existingDriver = await Driver.findOne({ email }).select('+password');
        console.log("Driver lookup result:", existingDriver ? { id: existingDriver._id, name: existingDriver.name, isActive: existingDriver.isActive } : "No driver found");

        if (!existingDriver) {
          console.log("No driver found with email:", email);
          throw new Error("Invalid email or password");
        }

        if (!existingDriver.isActive) {
          console.log("Driver account is deactivated");
          throw new Error("Account is deactivated")
        }

        if (!existingDriver.password) {
          console.log("Driver has no password set");
          throw new Error("Account does not have a password set")
        }

        const passwordMatches = await compare(credentials.password, existingDriver.password)
        console.log("Driver password match:", passwordMatches);

        if (!passwordMatches) {
          console.log("Driver password does not match");
          throw new Error("Invalid email or password")
        }

        await Driver.updateOne({ _id: existingDriver._id }, { $set: { updatedAt: new Date() } })

        console.log("Driver authentication successful");
        return {
          id: existingDriver._id?.toString() ?? "",
          email,
          name: existingDriver.name || "Driver",
          role: "driver",
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role || DEFAULT_ROLE
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? ""
        session.user.role = (token.role as string | undefined) || DEFAULT_ROLE
        session.user.email = session.user.email ?? (token.email as string | undefined) ?? null
      }

      return session
    },
  },
}
