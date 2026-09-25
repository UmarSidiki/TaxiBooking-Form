import { Setting } from "@/features/settings/model";
import { connectDB } from "@/shared/db";

export async function isAppointmentRequestEnabled(): Promise<boolean> {
  await connectDB();
  const settings = await Setting.findOne()
    .select("enableAppointmentRequest")
    .lean();
  return Boolean(settings?.enableAppointmentRequest);
}
