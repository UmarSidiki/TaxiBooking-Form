import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/features/auth";
import { connectDB } from "@/shared/db";
import { Setting } from "@/features/settings/model";
import { DeskDriverSignIn } from "@/features/drivers/ui/desk-driver-sign-in";

export default async function DriversPage() {
  await connectDB();
  const settings = await Setting.findOne();
  if (settings && settings.enableDrivers === false) {
    redirect(`/`);
  }

  const session = await getServerSession(authOptions);

  if (session?.user?.role === "driver") {
    redirect(`/drivers/dashboard`);
  }

  if (session?.user?.role === "admin" || session?.user?.role === "superadmin") {
    redirect(`/dashboard`);
  }

  if (session?.user) {
    redirect(`/`);
  }

  return <DeskDriverSignIn />;
}
