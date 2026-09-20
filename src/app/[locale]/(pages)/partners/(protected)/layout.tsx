import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { connectDB } from "@/shared/db";
import { Setting } from "@/features/settings/model";
import { authOptions } from "@/features/auth";
import { PartnerSidebar } from "@/features/partners/ui/partner-sidebar";
import { DeskChromeHeader } from "@/features/dashboard/ui/desk-chrome-header";
import { SidebarInset, SidebarProvider } from "@/shared/ui/sidebar";

type PartnerLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function PartnerProtectedLayout({
  children,
  params,
}: PartnerLayoutProps) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect(`/${locale}/partners/login`);
  }

  if (session.user.role === "admin" || session.user.role === "superadmin") {
    redirect(`/${locale}/dashboard`);
  }

  if (session.user.role !== "partner") {
    redirect(`/${locale}`);
  }

  await connectDB();
  const settings = await Setting.findOne();
  if (settings && settings.enablePartners === false) {
    redirect(`/${locale}`);
  }

  return (
    <SidebarProvider>
      <PartnerSidebar locale={locale} />
      <SidebarInset>
        <DeskChromeHeader />
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
