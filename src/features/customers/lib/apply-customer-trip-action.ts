import mongoose from "mongoose";
import { Booking, type IBooking } from "@/features/booking/model";
import { changeAllowed } from "@/features/customers/lib/customer-rides";
import { applyCancelBooking } from "@/features/booking/lib/apply-cancel-booking";
import { notifyCustomerTripChange } from "@/features/customers/lib/notify-customer-trip-change";
import { repriceCustomerTrip } from "@/features/customers/lib/reprice-customer-trip";
import { zonedRideInstant } from "@/features/booking/lib/send-pickup-reminders";
import { connectDB } from "@/shared/db";

export type CustomerTripAction = "cancel" | "change";

export type CustomerTripActionResult =
  | { ok: true; status: string; date: string; time: string; totalAmount?: number }
  | { ok: false; status: number; error: string; reason?: string };

const MODIFIABLE_STATUSES = ["requested", "awaiting_payment", "upcoming"];
const CANCELED_STATUSES = ["canceled", "cancelled"];

function emailPattern(email: string) {
  return new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
}

async function findOwnedTrip(id: string, email: string): Promise<IBooking | null> {
  const lookup: Record<string, unknown>[] = [{ tripId: id }];
  if (mongoose.isValidObjectId(id)) lookup.push({ _id: id });
  return Booking.findOne({ $or: lookup, email: emailPattern(email) });
}

export async function applyCustomerTripAction(input: {
  id: string;
  email: string;
  action: CustomerTripAction;
  date?: string;
  time?: string;
}): Promise<CustomerTripActionResult> {
  await connectDB();
  const booking = await findOwnedTrip(input.id, input.email);
  if (!booking) return { ok: false, status: 404, error: "not_found" };

  if (
    input.action === "cancel" &&
    CANCELED_STATUSES.includes(booking.status ?? "")
  ) {
    return okResult(booking);
  }

  if (!MODIFIABLE_STATUSES.includes(booking.status ?? "")) {
    return { ok: false, status: 409, error: "not_modifiable", reason: "status" };
  }

  if (!(await changeAllowed(booking))) {
    return { ok: false, status: 409, error: "not_modifiable", reason: "cutoff" };
  }

  if (input.action === "cancel") {
    return cancelTrip(booking);
  }

  if (!input.date && !input.time) {
    return { ok: false, status: 400, error: "invalid_body" };
  }
  return changeTrip(booking, input.date ?? booking.date, input.time ?? booking.time);
}

async function cancelTrip(booking: IBooking): Promise<CustomerTripActionResult> {
  const updateData: Partial<IBooking> = { updatedAt: new Date() };
  const applied = await applyCancelBooking(
    booking,
    String(booking._id),
    100,
    updateData
  );
  if (!applied.ok) {
    return {
      ok: false,
      status: applied.status,
      error: "refund_failed",
      reason: "refund",
    };
  }

  booking.set(applied.updateData);
  await booking.save();
  await notifyCustomerTripChange({
    booking,
    kind: "cancel",
    updateData: applied.updateData,
  });
  return okResult(booking);
}

async function changeTrip(
  booking: IBooking,
  date: string,
  time: string
): Promise<CustomerTripActionResult> {
  const instant = zonedRideInstant(date, time, "UTC");
  if (!instant || instant.getTime() <= Date.now()) {
    return { ok: false, status: 409, error: "not_modifiable", reason: "past" };
  }

  const repriced = await repriceCustomerTrip(booking, date, time);
  if (!repriced) {
    return { ok: false, status: 409, error: "not_modifiable", reason: "fare" };
  }

  booking.set({ ...repriced, updatedAt: new Date() });
  await booking.save();
  await notifyCustomerTripChange({ booking, kind: "change" });
  return okResult(booking);
}

function okResult(booking: IBooking): CustomerTripActionResult {
  return {
    ok: true,
    status: booking.status ?? "upcoming",
    date: booking.date,
    time: booking.time,
    totalAmount: booking.totalAmount,
  };
}
