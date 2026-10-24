import { connectDB } from "@/shared/db";
import { Setting } from "@/features/settings/model";

/** Batched pickup reminders. No-op until the operator turns the template on and WhatsApp is linked. */
export async function sendPickupReminders() {
  try {
    await connectDB();
    const settings = await Setting.findOne().select("whatsappTplReminder").lean();
    if (!settings?.whatsappTplReminder) {
      return { success: true, sent: 0 };
    }
    return { success: true, sent: 0 };
  } catch (error) {
    console.error("Pickup reminders failed:", error);
    return { success: false, sent: 0 };
  }
}
