import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongoose";
import Setting from "@/models/Setting";

export default async function AdminDriversLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if drivers module is enabled
  await connectDB();
  const settings = await Setting.findOne();
  if (settings && settings.enableDrivers === false) {
    redirect(`/dashboard/home`);
  }

  return <>{children}</>;
}
