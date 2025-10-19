import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/options";
import DriverLoginForm from "./components/DriverLoginForm";

export default async function DriversPage() {
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
