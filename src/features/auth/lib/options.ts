import { MongoDBAdapter } from "@auth/mongodb-adapter"
import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare, hash } from "bcryptjs"

import clientPromise from "@/shared/db/mongodb"
import { connectDB } from "@/shared/db"
import { authorizeDeskAccount } from "@/features/auth/lib/authorize-desk-account"
import { assertLoginAllowed } from "@/features/auth/lib/login-throttle"
import { User } from "@/features/auth/model"

const DEFAULT_ROLE = "admin"

/** First-admin bootstrap is opt-in so a fresh deploy cannot be claimed by anyone. */
function firstAdminBootstrapEnabled() {
  return process.env.ALLOW_FIRST_ADMIN_BOOTSTRAP === "true"
}

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise, {
    databaseName: process.env.MONGODB_DB,
  }),
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/dashboard/signin',
  },
  providers: [
    CredentialsProvider({
      name: "Email & Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required")
        }

        const email = credentials.email.trim().toLowerCase()
        await assertLoginAllowed(email, request as { headers?: Headers })

        await connectDB()

        const adminCount = await User.countDocuments({ role: { $in: ['admin', 'superadmin'] } })
        const existingUser = await User.findOne({ email }).select('+password')

        if (existingUser) {
          if (!existingUser.isActive) {
            throw new Error("Account is deactivated")
          }

          if (!existingUser.password) {
            throw new Error("Account does not have a password set")
          }

          const passwordMatches = await compare(credentials.password, existingUser.password)

          if (passwordMatches) {
            await User.updateOne({ _id: existingUser._id }, { $set: { updatedAt: new Date() } })

            return {
              id: existingUser._id?.toString() ?? "",
              email,
              name: existingUser.name,
              role: existingUser.role,
            }
          }

          throw new Error("Invalid email or password")
        }

        const deskUser = await authorizeDeskAccount(email, credentials.password)
        if (deskUser) return deskUser

        if (adminCount === 0 && firstAdminBootstrapEnabled()) {
          const hashedPassword = await hash(credentials.password, 10)

          const newAdmin = await User.create({
            email,
            password: hashedPassword,
            name: "Administrator",
            role: "admin",
            isActive: true,
          })

          return {
            id: newAdmin._id?.toString() ?? "",
            email,
            name: newAdmin.name,
            role: newAdmin.role,
          }
        }

        throw new Error("Invalid email or password")
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
