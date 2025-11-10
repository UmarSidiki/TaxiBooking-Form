import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/options";
import { connectDB } from "@/lib/database";
import { Setting } from "@/models/settings";
import { Partner } from "@/models/partner";

export default async function PartnersPage() {
  // Check if partners module is enabled
  await connectDB();
  const settings = await Setting.findOne();
  if (settings && settings.enablePartners === false) {
    redirect(`/`);
  }

  const session = await getServerSession(authOptions);

  // If user is logged in and is a partner, check approval status
  if (session?.user && session.user.role === "partner") {
    const partner = await Partner.findOne({ email: session.user.email });
    
    // Redirect based on approval status
    if (partner && partner.status !== "approved") {
      redirect(`/partners/account`);
    } else {
      redirect(`/partners/dashboard`);
    }
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
