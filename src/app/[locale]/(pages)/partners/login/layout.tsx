import { redirect } from "next/navigation";
import { connectDB } from "@/shared/db";
import { Setting } from "@/features/settings/model";

export default async function PartnerLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if partners module is enabled
  await connectDB();
  const settings = await Setting.findOne();
  if (settings && settings.enablePartners === false) {
    redirect(`/`);
  }

  return <>{children}</>;
}
