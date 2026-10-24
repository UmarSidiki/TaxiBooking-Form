import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/features/auth";
import { Partner } from "@/features/partners/model";
import { connectDB } from "@/shared/db";
import { partnerMayWork } from "@/features/partners/lib/partner-access";

export default async function PartnerBillingLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/partners/login");

  await connectDB();
  const partner = await Partner.findOne({ email: session.user.email }).select("status");
  if (partner && !partnerMayWork(partner)) {
    redirect("/partners/account");
  }

  return <>{children}</>;
}
