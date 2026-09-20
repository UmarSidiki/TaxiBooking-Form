import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { connectDB } from "@/shared/db";
import { Setting } from "@/features/settings/model";
import { authOptions } from "@/features/auth";
import { DriverSidebar } from "@/features/drivers/ui/driver-sidebar";
import { DeskChromeHeader } from "@/features/dashboard/ui/desk-chrome-header";
import { SidebarInset, SidebarProvider } from "@/shared/ui/sidebar";

type DriverLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function DriverProtectedLayout({
  children,
  params,
}: DriverLayoutProps) {
  const session = await getServerSession(authOptions);
  const { locale } = await params;

  if (!session?.user) {
    redirect(`/${locale}/drivers/login`);
  }

  if (session.user.role === "admin" || session.user.role === "superadmin") {
    redirect(`/${locale}/dashboard`);
  }

  if (session.user.role !== "driver") {
    redirect(`/${locale}`);
  }

  await connectDB();
  const settings = await Setting.findOne();
  if (settings && settings.enableDrivers === false) {
    redirect(`/${locale}`);
  }

  return (
    <SidebarProvider>
      <DriverSidebar locale={locale} />
      <SidebarInset>
        <DeskChromeHeader />
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
