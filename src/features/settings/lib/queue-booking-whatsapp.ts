import type { IBooking } from "@/features/booking/model";
import type { BookingPatchAction } from "@/features/booking/schema/booking-patch.schema";
import {
  phonesForAssignees,
  queueAssigneeNotice,
  type NoticeRecipient,
} from "@/features/settings/lib/assignee-whatsapp";

function rideOf(booking: IBooking) {
  return {
    tripId: booking.tripId,
    pickup: booking.pickup,
    date: booking.date,
    time: booking.time,
  };
}

function idOf(ref?: { _id?: unknown } | null) {
  return ref?._id ? String(ref._id) : undefined;
}

export function queueBookingWhatsApp(input: {
  action: BookingPatchAction;
  before: IBooking;
  after: IBooking;
}) {
  void run(input).catch((error) => {
    console.error("WhatsApp booking notice failed:", error);
  });
}

async function run(input: { action: BookingPatchAction; before: IBooking; after: IBooking }) {
  const ride = rideOf(input.after);
  if (input.action === "cancel") {
    const people = await phonesForAssignees({
      driverId: idOf(input.before.assignedDriver),
      partnerId: idOf(input.before.assignedPartner),
    });
    const recipients = [people.driver, people.partner].filter(Boolean) as NoticeRecipient[];
    queueAssigneeNotice({ kind: "cancelled", recipients, ride });
    return;
  }

  if (input.action === "assign" && input.after.assignedDriver) {
    const nextId = idOf(input.after.assignedDriver);
    const prevId = idOf(input.before.assignedDriver);
    const next = await phonesForAssignees({ driverId: nextId });
    if (next.driver) queueAssigneeNotice({ kind: "assigned", recipients: [next.driver], ride });
    if (prevId && prevId !== nextId) {
      const prev = await phonesForAssignees({ driverId: prevId });
      if (prev.driver) queueAssigneeNotice({ kind: "changed", recipients: [prev.driver], ride });
    }
  }

  if (input.action === "assignpartner" && input.after.assignedPartner) {
    const nextId = idOf(input.after.assignedPartner);
    const prevId = idOf(input.before.assignedPartner);
    const next = await phonesForAssignees({ partnerId: nextId });
    if (next.partner) queueAssigneeNotice({ kind: "assigned", recipients: [next.partner], ride });
    if (prevId && prevId !== nextId) {
      const prev = await phonesForAssignees({ partnerId: prevId });
      if (prev.partner) queueAssigneeNotice({ kind: "changed", recipients: [prev.partner], ride });
    }
  }
}
