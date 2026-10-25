import type { IBooking } from "@/features/booking/model";
import type { BookingPatchApplyResult } from "@/features/booking/lib/booking-patch-result";
import type { BookingPatchBody } from "@/features/booking/schema/booking-patch.schema";
import { findAssigneeConflict } from "@/features/calendar/lib/find-assignee-conflict";
import { driverTimeOffBlocks } from "@/features/drivers/lib/driver-time-off-block";

export async function applyEditBooking(
  booking: IBooking,
  edit: BookingPatchBody["edit"],
  updateData: Partial<IBooking>,
): Promise<BookingPatchApplyResult> {
  if (!edit || booking.status === "canceled") {
    return { ok: false, status: 400, message: "invalid_body" };
  }
  const next = {
    date: edit.date ?? booking.date,
    time: edit.time ?? booking.time,
    bookingType: booking.bookingType,
    duration: booking.duration,
    tripType: booking.tripType,
  };
  const changed =
    edit.pickup ||
    edit.dropoff !== undefined ||
    edit.date ||
    edit.time ||
    edit.notes !== undefined;
  if (!changed) return { ok: false, status: 400, message: "invalid_body" };

  const driverId = booking.assignedDriver?._id ? String(booking.assignedDriver._id) : "";
  if (driverId && (await driverTimeOffBlocks(driverId, next))) {
    return { ok: false, status: 409, message: "driver_time_off" };
  }

  if (edit.pickup) updateData.pickup = edit.pickup;
  if (edit.dropoff !== undefined) updateData.dropoff = edit.dropoff;
  if (edit.date) updateData.date = edit.date;
  if (edit.time) updateData.time = edit.time;
  if (edit.notes !== undefined) updateData.notes = edit.notes;

  const conflict = driverId
    ? await findAssigneeConflict({
        field: "assignedDriver._id",
        assigneeId: driverId,
        booking: { ...next, _id: booking._id },
      })
    : null;
  return conflict ? { ok: true, updateData, warn: conflict } : { ok: true, updateData };
}
