import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/features/auth";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  // If user is not logged in, redirect to signin
  if (!session?.user) {
    redirect(`/dashboard/signin`);
  }

  // If user is logged in but not an admin, redirect to drivers page
  if (session.user.role !== "admin" && session.user.role !== "superadmin") {
    redirect(`/drivers`);
  }

  // If user is admin, redirect to the protected dashboard home page
  // (the protected layout will be applied automatically for that page).
  redirect(`/dashboard/home`);
}