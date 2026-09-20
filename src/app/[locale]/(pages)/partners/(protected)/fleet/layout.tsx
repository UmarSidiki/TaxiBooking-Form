import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { connectDB } from "@/shared/db";
import { Partner } from "@/features/partners/model";
import { authOptions } from "@/features/auth";

export default async function PartnerFleetLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect(`/partners/login`);
  }

  await connectDB();
  const partner = await Partner.findOne({ email: session.user.email });
  if (partner && partner.status !== "approved") {
    redirect(`/partners/account`);
  }

  return <>{children}</>;
}
