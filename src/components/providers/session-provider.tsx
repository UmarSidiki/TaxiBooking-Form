'use client'

import type { Session } from "next-auth"
import { SessionProvider } from "next-auth/react"
import type { ReactNode } from "react"

type SessionProviderProps = {
  children: ReactNode
  session?: Session | null
}

export default function AuthSessionProvider({ children, session }: SessionProviderProps) {
  return <SessionProvider session={session}>{children}</SessionProvider>
}
