import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongoose";
import Setting from "@/models/Setting";

export default async function PartnerRegisterLayout({
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
