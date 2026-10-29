import { connectDB } from "@/shared/db";
import { Booking } from "@/features/booking/model";
import { Setting } from "@/features/settings/model";
import { DEFAULT_BOOKING_TIMEZONE } from "@/features/rides/lib/ride-constants";
import {
  deliverAssigneeNotice,
  phonesForAssignees,
  type NoticeRecipient,
  type WhatsAppSend,
} from "@/features/settings/lib/assignee-whatsapp";
import { readWhatsAppLinked } from "@/features/settings/lib/whatsapp-mongo-auth";
import {
  isNotificationEnabled,
  notificationTiming,
} from "@/features/notifications/lib/notification-resolution";

function dayStamp(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
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
    const [timing, driverOn, partnerOn, settings] = await Promise.all([
      notificationTiming("pickup_reminder"),
      isNotificationEnabled("pickup_reminder", "whatsapp", "driver"),
      isNotificationEnabled("pickup_reminder", "whatsapp", "partner"),
      Setting.findOne().select("timezone").lean<{ timezone?: string }>(),
    ]);
    if (!driverOn && !partnerOn) return { success: true, sent: 0, failed: 0 };

    const timeZone = settings?.timezone || DEFAULT_BOOKING_TIMEZONE;
    const horizon = new Date(now.getTime() + timing.hoursBefore * 60 * 60 * 1000);
    const candidates = await Booking.find({
      status: "upcoming",
      pickupReminderSent: { $ne: true },
      date: { $gte: dayStamp(now, timeZone), $lte: dayStamp(horizon, timeZone) },
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
      return instant && instant.getTime() >= now.getTime() && instant.getTime() <= horizon.getTime();
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
      await Booking.updateMany(
        { _id: { $in: claimed.map((ride) => ride._id) } },
        { $set: { pickupReminderSent: false } },
      );
      console.info("WhatsApp pickup reminders skipped: session not linked");
      return { success: true, sent: 0, failed: claimed.length };
    }

    let sent = 0;
    let failed = 0;
    for (const ride of claimed) {
      const people = await phonesForAssignees({
        driverId: ride.assignedDriver?._id ? String(ride.assignedDriver._id) : undefined,
        partnerId: ride.assignedPartner?._id ? String(ride.assignedPartner._id) : undefined,
      });
      const recipients = [people.driver, people.partner].filter(Boolean) as NoticeRecipient[];
      const result = await deliverAssigneeNotice(
        {
          kind: "reminder",
          recipients,
          ride: { tripId: ride.tripId, pickup: ride.pickup, date: ride.date, time: ride.time },
        },
        deps,
      );
      if (result.reason === "sent") {
        sent += result.sent;
        continue;
      }
      failed += 1;
      await Booking.updateOne({ _id: ride._id }, { $set: { pickupReminderSent: false } });
    }

    return { success: true, sent, failed };
  } catch (error) {
    console.error("Pickup reminders failed:", error);
    return { success: false, sent: 0, failed: 0 };
  }
}
