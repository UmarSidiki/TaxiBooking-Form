import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/features/auth";
import { AppSidebar } from "@/features/dashboard/ui/app-sidebar";
import { DeskChromeHeader } from "@/features/dashboard/ui/desk-chrome-header";
import { SidebarInset, SidebarProvider } from "@/shared/ui/sidebar";

type DashboardLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function DashboardProtectedLayout({
  children,
  params,
}: DashboardLayoutProps) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect(`/dashboard/signin`);
  }

  const role = session.user.role;
  if (role !== "admin" && role !== "superadmin") {
    redirect(`/drivers`);
  }

  return (
    <SidebarProvider>
      <AppSidebar locale={locale} />
      <SidebarInset>
        <DeskChromeHeader />
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
