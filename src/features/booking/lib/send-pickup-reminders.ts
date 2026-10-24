import { connectDB } from "@/shared/db";
import { Booking } from "@/features/booking/model";
import { Setting } from "@/features/settings/model";
import { DEFAULT_BOOKING_TIMEZONE } from "@/features/rides/lib/ride-constants";
import {
  messagesFor,
  phonesForAssignees,
  type WhatsAppSend,
} from "@/features/settings/lib/assignee-whatsapp";
import { readWhatsAppLinked } from "@/features/settings/lib/whatsapp-mongo-auth";

function dayStamp(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function addDays(stamp: string, days: number) {
  const [year, month, day] = stamp.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

/** Interpret the stored clock time in the operator timezone. */
export function zonedRideInstant(date: string, time: string, timeZone: string) {
  const guess = new Date(`${date}T${time || "00:00"}:00Z`);
  if (Number.isNaN(guess.getTime())) return null;
  const wall = new Date(guess.toLocaleString("en-US", { timeZone }));
  return new Date(guess.getTime() + (guess.getTime() - wall.getTime()));
}

export async function sendPickupReminders(
  now = new Date(),
  deps?: { linked?: () => Promise<boolean>; send?: WhatsAppSend },
) {
  try {
    await connectDB();
    const settings = await Setting.findOne().select("whatsappTplReminder timezone").lean();
    if (!settings?.whatsappTplReminder) return { success: true, sent: 0, failed: 0 };

    const timeZone = settings.timezone || DEFAULT_BOOKING_TIMEZONE;
    const today = dayStamp(now, timeZone);
    const tomorrow = addDays(today, 1);
    const horizon = now.getTime() + 24 * 60 * 60 * 1000;
    const candidates = await Booking.find({
      status: "upcoming",
      pickupReminderSent: { $ne: true },
      date: { $gte: today, $lte: tomorrow },
      $or: [
        { "assignedDriver._id": { $exists: true } },
        { "assignedPartner._id": { $exists: true } },
      ],
    })
      .select("tripId date time pickup assignedDriver assignedPartner")
      .limit(200)
      .lean();

    const due = candidates.filter((ride) => {
      const instant = zonedRideInstant(ride.date, ride.time, timeZone);
      return instant && instant.getTime() >= now.getTime() && instant.getTime() <= horizon;
    });

    const claimed: typeof due = [];
    for (const ride of due) {
      const updated = await Booking.findOneAndUpdate(
        { _id: ride._id, pickupReminderSent: { $ne: true } },
        { $set: { pickupReminderSent: true } },
      );
      if (updated) claimed.push(ride);
    }
    if (!claimed.length) return { success: true, sent: 0, failed: 0 };

    const linked = deps?.linked ?? readWhatsAppLinked;
    if (!(await linked())) {
      await Booking.updateMany({ _id: { $in: claimed.map((ride) => ride._id) } }, { $set: { pickupReminderSent: false } });
      console.info("WhatsApp pickup reminders skipped: session not linked");
      return { success: true, sent: 0, failed: claimed.length };
    }

    const messages = [];
    const sentIds = [];
    for (const ride of claimed) {
      const people = await phonesForAssignees({
        driverId: ride.assignedDriver?._id ? String(ride.assignedDriver._id) : undefined,
        partnerId: ride.assignedPartner?._id ? String(ride.assignedPartner._id) : undefined,
      });
      const built = messagesFor(
        "reminder",
        [people.driver, people.partner].filter(Boolean) as { phone?: string | null }[],
        { tripId: ride.tripId, pickup: ride.pickup, date: ride.date, time: ride.time },
      );
      if (!built.length) {
        await Booking.updateOne({ _id: ride._id }, { $set: { pickupReminderSent: false } });
        continue;
      }
      messages.push(...built);
      sentIds.push(ride._id);
    }
    if (!messages.length) return { success: true, sent: 0, failed: 0 };

    const send = deps?.send ?? (async (batch) => {
      const { sendWhatsAppTexts } = await import("@/features/settings/lib/whatsapp-session");
      return sendWhatsAppTexts(batch);
    });
    const result = await send(messages);
    if (!result.ok) {
      await Booking.updateMany({ _id: { $in: sentIds } }, { $set: { pickupReminderSent: false } });
      console.error("WhatsApp pickup reminders failed");
      return { success: true, sent: 0, failed: sentIds.length };
    }
    console.info("WhatsApp pickup reminders", messages.map((message) => message.jid));
    return { success: true, sent: messages.length, failed: 0 };
  } catch (error) {
    console.error("Pickup reminders failed:", error);
    return { success: false, sent: 0, failed: 0 };
  }
}
