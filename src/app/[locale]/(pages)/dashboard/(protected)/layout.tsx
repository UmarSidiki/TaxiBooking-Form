import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth/options"
import { AppSidebar } from "@/components/AppSidebar"
import { SidebarProvider } from "@/components/ui/sidebar"

type DashboardLayoutProps = {
  children: ReactNode
  params: { locale: string }
}

export default async function DashboardProtectedLayout({
  children,
  params,
}: DashboardLayoutProps) {
  const { locale } = params
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect(`/${locale}/dashboard/signin`)
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <AppSidebar locale={locale} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </SidebarProvider>
  )
}
