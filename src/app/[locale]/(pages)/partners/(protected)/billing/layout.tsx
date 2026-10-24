import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/features/auth";
import { Partner } from "@/features/partners/model";
import { connectDB } from "@/shared/db";

export default async function PartnerBillingLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/partners/login");

  await connectDB();
  const partner = await Partner.findOne({ email: session.user.email }).select("status");
  if (partner && partner.status !== "approved") {
    redirect("/partners/account");
  }

  return <>{children}</>;
}
