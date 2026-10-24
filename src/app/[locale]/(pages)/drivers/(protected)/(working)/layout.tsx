import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/features/auth";
import { driverWorks } from "@/features/drivers/lib/driver-approval";
import { Driver } from "@/features/drivers/model";
import { connectDB } from "@/shared/db";

export default async function DriverWorkingLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect(`/${locale}/drivers/login`);

  await connectDB();
  const driver = await Driver.findById(session.user.id).select("status isActive");
  if (!driverWorks(driver?.status) || driver?.isActive === false) {
    redirect(`/${locale}/drivers/account`);
  }

  return <>{children}</>;
}
