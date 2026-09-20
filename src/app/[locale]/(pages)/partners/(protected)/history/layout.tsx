import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { connectDB } from "@/shared/db";
import { Partner } from "@/features/partners/model";
import { authOptions } from "@/features/auth";

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
  if (partner && partner.status !== "approved") {
    redirect(`/partners/account`);
  }

  return <>{children}</>;
}
