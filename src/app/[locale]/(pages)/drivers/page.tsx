import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/features/auth";
import { connectDB } from "@/shared/db";
import { Setting } from "@/features/settings/model";
import DriverLoginForm from "@/features/drivers/ui/driver-login-form";

export default async function DriversPage() {
  // Check if drivers module is enabled
  await connectDB();
  const settings = await Setting.findOne();
  if (settings && settings.enableDrivers === false) {
    redirect(`/`);
  }

  const session = await getServerSession(authOptions);

  // If user is logged in and is a driver, redirect to driver dashboard
  if (session?.user && session.user.role === "driver") {
    redirect(`/drivers/dashboard`);
  }

  // If user is logged in and is an admin, redirect to admin dashboard
  if (session?.user && session.user.role === "admin") {
    redirect(`/dashboard`);
  }

  // If user is logged in but has an unknown role, redirect to home
  if (session?.user) {
    redirect(`/`);
  }

  // If not logged in, show login form
  return <DriverLoginForm />;
}
