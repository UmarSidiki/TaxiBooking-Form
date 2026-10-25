import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { connectDB } from "@/shared/db";
import { Partner } from "@/features/partners/model";
import { authOptions } from "@/features/auth";
import { partnerMayWork } from "@/features/partners/lib/partner-access";

type HistoryLayoutProps = {
  children: ReactNode;
};

export default async function PartnerHistoryLayout({
  children,
}: HistoryLayoutProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect(`/partners/login`);
  }

  // Get partner data to check approval status
  await connectDB();
  const partner = await Partner.findOne({ email: session.user.email });

  // If partner is not approved, redirect to account page
  if (partner && !partnerMayWork(partner)) {
    redirect(`/partners/account`);
  }

  return <>{children}</>;
}
