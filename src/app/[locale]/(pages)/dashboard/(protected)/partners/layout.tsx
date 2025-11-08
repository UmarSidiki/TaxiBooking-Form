import { redirect } from "next/navigation";
import { connectDB } from "@/lib/database";
import { Setting } from "@/models/settings";

export default async function AdminPartnersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if partners module is enabled
  await connectDB();
  const settings = await Setting.findOne();
  if (settings && settings.enablePartners === false) {
    redirect(`/dashboard/home`);
  }

  return <>{children}</>;
}
