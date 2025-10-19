import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/options";

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

  // If user is admin, redirect to the protected dashboard home page
  // (the protected layout will be applied automatically for that page).
  redirect(`/${params.locale}/dashboard/home`);
}