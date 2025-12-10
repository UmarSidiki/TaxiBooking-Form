import { MongoDBAdapter } from "@auth/mongodb-adapter"
import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare, hash } from "bcryptjs"

import clientPromise from "@/lib/database/mongodb"
import { connectDB } from "@/lib/database"
import { Driver } from "@/models/driver"
import { Partner } from "@/models/partner"
import { User } from "@/models/user"

const DEFAULT_ROLE = "admin"

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
      async authorize(credentials) {
        console.log("NextAuth authorize called with credentials:", { email: credentials?.email, password: "[REDACTED]" });
        if (!credentials?.email || !credentials?.password) {
          console.log("Missing email or password");
          throw new Error("Email and password are required")
        }

        await connectDB();
        const email = credentials.email.trim().toLowerCase()
        console.log("Normalized email:", email);

        // Check if there are any admin users in the system
        const adminCount = await User.countDocuments({ role: { $in: ['admin', 'superadmin'] } });
        console.log("Admin count in system:", adminCount);

        // First check if it's an admin user in the User collection
        const existingUser = await User.findOne({ email }).select('+password');
        console.log("User lookup result:", existingUser ? { id: existingUser._id, name: existingUser.name, role: existingUser.role, isActive: existingUser.isActive } : "No user found");

        if (existingUser) {
          // Existing user - validate credentials
          if (!existingUser.isActive) {
            console.log("User account is deactivated");
            throw new Error("Account is deactivated")
          }

          if (!existingUser.password) {
            console.log("User has no password set");
            throw new Error("Account does not have a password set")
          }

          const passwordMatches = await compare(credentials.password, existingUser.password)
          console.log("User password match:", passwordMatches);

          if (passwordMatches) {
            await User.updateOne({ _id: existingUser._id }, { $set: { updatedAt: new Date() } })

            console.log("User authentication successful");
            return {
              id: existingUser._id?.toString() ?? "",
              email,
              name: existingUser.name,
              role: existingUser.role,
            }
          } else {
            console.log("User password does not match");
            throw new Error("Invalid email or password")
          }
        } else {
          // No existing user found - check partners collection
          const existingPartner = await Partner.findOne({ email }).select('+password');
          console.log("Partner lookup result:", existingPartner ? { id: existingPartner._id, name: existingPartner.name, status: existingPartner.status, isActive: existingPartner.isActive } : "No partner found");

          if (existingPartner) {
            // Partner found - validate credentials
            if (!existingPartner.isActive) {
              console.log("Partner account is deactivated");
              throw new Error("Account is deactivated")
            }

            if (existingPartner.status === "rejected") {
              console.log("Partner account is rejected");
              throw new Error("Your account has been rejected. Please contact support.")
            }

            if (existingPartner.status === "suspended") {
              console.log("Partner account is suspended");
              throw new Error("Your account has been suspended. Please contact support.")
            }

            if (!existingPartner.password) {
              console.log("Partner has no password set");
              throw new Error("Account does not have a password set")
            }

            const passwordMatches = await compare(credentials.password, existingPartner.password)
            console.log("Partner password match:", passwordMatches);

            if (passwordMatches) {
              await Partner.updateOne({ _id: existingPartner._id }, { $set: { updatedAt: new Date() } })

              console.log("Partner authentication successful");
              return {
                id: existingPartner._id?.toString() ?? "",
                email,
                name: existingPartner.name || "Partner",
                role: "partner",
              }
            } else {
              console.log("Partner password does not match");
              throw new Error("Invalid email or password")
            }
          } else {
            // No existing user or partner found - check drivers collection (legacy support)
            const existingDriver = await Driver.findOne({ email }).select('+password');
            console.log("Driver lookup result:", existingDriver ? { id: existingDriver._id, name: existingDriver.name, isActive: existingDriver.isActive } : "No driver found");

            if (existingDriver) {
              // Driver found - validate credentials
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

              if (passwordMatches) {
                await Driver.updateOne({ _id: existingDriver._id }, { $set: { updatedAt: new Date() } })

                console.log("Driver authentication successful");
                return {
                  id: existingDriver._id?.toString() ?? "",
                  email,
                  name: existingDriver.name || "Driver",
                  role: "driver",
                }
              } else {
                console.log("Driver password does not match");
                throw new Error("Invalid email or password")
              }
            } else {
            // No user or driver found - check if this should be the first admin
            if (adminCount === 0) {
              console.log("No admins exist - creating first admin user");

              // Hash the password
              const hashedPassword = await hash(credentials.password, 10);

              // Create the first admin user
              const newAdmin = await User.create({
                email,
                password: hashedPassword,
                name: "Administrator", // Default name for first admin
                role: "admin",
                isActive: true,
              });

              console.log("First admin user created successfully");
              return {
                id: newAdmin._id?.toString() ?? "",
                email,
                name: newAdmin.name,
                role: newAdmin.role,
              }
              } else {
                console.log("Admins exist but user/partner/driver not found - cannot auto-register");
                throw new Error("Invalid email or password")
              }
            }
          }
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
