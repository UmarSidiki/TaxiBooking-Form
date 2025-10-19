import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/options";
// Import the protected page (not the layout) — the layout expects params/children
// and cannot be rendered directly as a component here.
import ProtectedDashboardPage from "./(protected)/page";

interface DashboardPageProps {
  params: { locale: string };
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const session = await getServerSession(authOptions);

  // If user is not logged in, redirect to signin
  if (!session?.user) {
    redirect(`/${params.locale}/dashboard/signin`);
  }

  // If user is logged in but not an admin, redirect to drivers page
  if (session.user.role !== "admin") {
    redirect(`/${params.locale}/drivers`);
  }

  // If user is admin, render the protected dashboard page
  // (the protected layout will be applied automatically for that page).
  return <ProtectedDashboardPage />;
}