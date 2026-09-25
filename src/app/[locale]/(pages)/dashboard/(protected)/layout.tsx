import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/features/auth";
import { SettingsDeskProvider } from "@/features/settings/ui/settings-desk-context";
import { AppSidebar } from "@/features/dashboard/ui/app-sidebar";
import { DeskShell } from "@/features/dashboard/ui/desk-shell";

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
    <SettingsDeskProvider>
      <DeskShell sidebar={<AppSidebar locale={locale} />}>{children}</DeskShell>
    </SettingsDeskProvider>
  );
}
