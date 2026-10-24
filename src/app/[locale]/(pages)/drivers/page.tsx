import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/features/auth";
import { connectDB } from "@/shared/db";
import { Setting } from "@/features/settings/model";
import { DeskDriverSignIn } from "@/features/drivers/ui/desk-driver-sign-in";
import { Driver } from "@/features/drivers/model";
import { driverWorks } from "@/features/drivers/lib/driver-approval";

export default async function DriversPage() {
  await connectDB();
  const settings = await Setting.findOne();
  if (settings && settings.enableDrivers === false) {
    redirect(`/`);
  }

  const session = await getServerSession(authOptions);

  if (session?.user?.role === "driver") {
    const driver = await Driver.findById(session.user.id).select("status");
    redirect(
      driverWorks(driver?.status) ? "/drivers/dashboard" : "/drivers/account",
    );
  }

  if (session?.user?.role === "admin" || session?.user?.role === "superadmin") {
    redirect(`/dashboard`);
  }

  if (session?.user) {
    redirect(`/`);
  }

  return <DeskDriverSignIn />;
}
