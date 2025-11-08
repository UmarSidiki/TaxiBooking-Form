import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/options";
import { connectDB } from "@/lib/database";
import { Setting } from "@/models/settings";

export default async function PartnersPage() {
  // Check if partners module is enabled
  await connectDB();
  const settings = await Setting.findOne();
  if (settings && settings.enablePartners === false) {
    redirect(`/`);
  }

  const session = await getServerSession(authOptions);

  // If user is logged in and is a partner, redirect to partner dashboard
  if (session?.user && session.user.role === "partner") {
    redirect(`/partners/dashboard`);
  }

  // If user is logged in and is an admin, redirect to admin dashboard
  if (session?.user && session.user.role === "admin") {
    redirect(`/dashboard`);
  }

  // If user is logged in but has an unknown role, redirect to home
  if (session?.user) {
    redirect(`/`);
  }

  // If not logged in, redirect to login
  redirect(`/partners/login`);
}
