import { MongoDBAdapter } from "@auth/mongodb-adapter"
import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare, hash } from "bcryptjs"
import type { ObjectId } from "mongodb"

import clientPromise, { getMongoDb } from "@/lib/mongodb"

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
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required")
        }

        const db = await getMongoDb()
        const users = db.collection("users")
        const email = credentials.email.trim().toLowerCase()

        const existingUser = await users.findOne<{
          _id: ObjectId
          password?: string
          name?: string
          role?: string
        }>({ email });

        const userCount = await users.countDocuments();

        if (!existingUser) {
          if (userCount === 0) {
            const passwordHash = await hash(credentials.password, 10);
            const now = new Date();
            const nameFromEmail = credentials.email.split("@")[0] || "Admin";

            const insertResult = await users.insertOne({
              email,
              name: nameFromEmail,
              role: DEFAULT_ROLE,
              password: passwordHash,
              emailVerified: null,
              image: null,
              createdAt: now,
              updatedAt: now,
            });

            return {
              id: insertResult.insertedId.toString(),
              email,
              name: nameFromEmail,
              role: DEFAULT_ROLE,
            };
          }
          throw new Error(
            "No user found with this email. Only registered admins can log in."
          );
        }

        if (!existingUser.password) {
          throw new Error("Account does not have a password set")
        }

        const passwordMatches = await compare(credentials.password, existingUser.password)

        if (!passwordMatches) {
          throw new Error("Invalid email or password")
        }

        await users.updateOne({ _id: existingUser._id }, { $set: { updatedAt: new Date() } })

        return {
          id: existingUser._id?.toString() ?? "",
          email,
          name: existingUser.name || "Admin",
          role: existingUser.role || DEFAULT_ROLE,
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
