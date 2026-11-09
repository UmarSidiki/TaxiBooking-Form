import NextAuth from "next-auth"

import { authOptions } from "@/features/auth"

// NextAuth normally needs NEXTAUTH_URL pinned to the public origin. When it is
// not set, trust the forwarded host of each request instead, so callbacks and
// cookies follow whatever domain the app is served from (localhost, a preview
// URL, or the operator's own domain) without any deployment configuration.
if (!process.env.NEXTAUTH_URL) {
  process.env.AUTH_TRUST_HOST = "true"
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
