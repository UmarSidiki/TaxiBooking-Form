import { redirect } from "next/navigation";

import { Setting } from "@/features/settings/model";
import { connectDB } from "@/shared/db";

export default async function DriverRegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connectDB();
  const settings = await Setting.findOne().select("enableDrivers");
  if (settings && settings.enableDrivers === false) {
    redirect("/");
  }

  return <>{children}</>;
}
