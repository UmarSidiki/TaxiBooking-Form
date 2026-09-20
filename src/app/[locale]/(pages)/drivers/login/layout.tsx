import { redirect } from "next/navigation";
import { connectDB } from "@/shared/db";
import { Setting } from "@/features/settings/model";

export default async function DriverLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if drivers module is enabled
  await connectDB();
  const settings = await Setting.findOne();
  if (settings && settings.enableDrivers === false) {
    redirect(`/`);
  }

  return <>{children}</>;
}
