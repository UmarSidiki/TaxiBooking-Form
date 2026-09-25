import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { connectDB } from "@/shared/db";
import { Setting } from "@/features/settings/model";
import { authOptions } from "@/features/auth";
import { PartnerSidebar } from "@/features/partners/ui/partner-sidebar";
import { DeskShell } from "@/features/dashboard/ui/desk-shell";

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
    <DeskShell sidebar={<PartnerSidebar locale={locale} />}>{children}</DeskShell>
  );
}
