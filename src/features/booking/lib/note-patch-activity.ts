import type { BookingPatchAction } from "@/features/booking/schema/booking-patch.schema";
import { recordRideActivity } from "@/features/rides/lib/record-ride-activity";

const ACTIVITY: Partial<Record<BookingPatchAction, string>> = {
  assign: "assigned",
  assignpartner: "assigned",
  cancel: "cancelled",
  complete: "completed",
  edit: "edited",
  approvepartner: "approved",
  quote: "quoted",
  confirmcash: "confirmed",
  decline: "declined",
};

export async function notePatchActivity(
  action: BookingPatchAction,
  bookingId: string,
  actor?: { id: string; role: "admin" | "driver" | "partner" | "system" },
) {
  const name = ACTIVITY[action];
  if (!name) return;
  try {
    await recordRideActivity({
      bookingId,
      actorId: actor?.id ?? "system",
      actorRole: actor?.role ?? "system",
      action: name,
    });
  } catch (error) {
    console.error("Ride activity failed:", error);
  }
}
