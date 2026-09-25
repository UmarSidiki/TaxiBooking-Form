import { Setting } from "@/features/settings/model";
import { connectDB } from "@/shared/db";

export async function isDeskBookingEnabled(): Promise<boolean> {
  await connectDB();
  const settings = await Setting.findOne().select("enableDeskBooking").lean();
  return Boolean(settings?.enableDeskBooking);
}
