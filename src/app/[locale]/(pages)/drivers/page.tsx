import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/options";
import DriverLoginForm from "./components/DriverLoginForm";

interface DriversPageProps {
  params: { locale: string };
}

export default async function DriversPage({ params }: DriversPageProps) {
  const session = await getServerSession(authOptions);

  // If user is logged in and is a driver, redirect to driver dashboard
  if (session?.user && session.user.role === "driver") {
    redirect(`/${params.locale}/drivers/dashboard`);
  }

  // If user is logged in and is an admin, redirect to admin dashboard
  if (session?.user && session.user.role === "admin") {
    redirect(`/${params.locale}/dashboard`);
  }

  // If user is logged in but has an unknown role, redirect to home
  if (session?.user) {
    redirect(`/${params.locale}`);
  }

  // If not logged in, show login form
  return <DriverLoginForm />;
}