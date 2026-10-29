import { sendOrderCancellationEmail } from "@/features/booking/email/order-cancellation";
import { sendOrderConfirmationEmail } from "@/features/booking/email/order-confirmation";
import { createCancellationEmailData } from "@/features/booking/lib/build-cancellation-email-data";
import {
  bookingTotalOrZero,
  buildRideDispatchEmailPayload,
} from "@/features/booking/lib/build-ride-dispatch-email";
import { getSettingsCurrency } from "@/features/booking/lib/get-settings-currency";
import { buildBookingEmailDataFromBooking } from "@/features/payments/lib/booking-email-data";
import { sendRideAssignmentEmail } from "@/features/rides/email/ride-assignment";
import { sendRideCancellationEmail } from "@/features/rides/email/ride-cancellation";
import { resolvePublicUrl } from "@/features/settings/lib/public-url";
import { sendTripChangeAdminEmail } from "@/features/customers/email/trip-change-admin";
import type { IBooking } from "@/features/booking/model";

async function notifyAssignees(booking: IBooking, kind: "cancel" | "change") {
  const assignees = [booking.assignedDriver, booking.assignedPartner].filter(
    (assignee): assignee is { _id: string; name: string; email: string } =>
      Boolean(assignee?.email)
  );

  await Promise.all(
    assignees.map((assignee) => {
      const payload = buildRideDispatchEmailPayload(
        booking,
        assignee,
        bookingTotalOrZero(booking)
      );
      return kind === "cancel"
        ? sendRideCancellationEmail(payload)
        : sendRideAssignmentEmail(payload);
    })
  );
}

/**
 * Customer-initiated cancel/change: tell the customer, the operator and any
 * assigned driver or partner. Notification failures never undo the action.
 */
export async function notifyCustomerTripChange(input: {
  booking: IBooking;
  kind: "cancel" | "change";
  updateData?: Partial<IBooking>;
  baseUrl?: string;
}) {
  const { booking, kind, updateData } = input;
  try {
    const [currency, baseUrl] = await Promise.all([
      getSettingsCurrency(),
      input.baseUrl
        ? Promise.resolve(input.baseUrl)
        : resolvePublicUrl().then((url) => url ?? undefined),
    ]);

    const customerEmail =
      kind === "cancel"
        ? sendOrderCancellationEmail(
            createCancellationEmailData(booking, updateData ?? {})
          )
        : sendOrderConfirmationEmail(
            buildBookingEmailDataFromBooking(booking, {
              paymentMethod: booking.paymentMethod || "pending",
              currency,
              baseUrl,
            })
          );

    const results = await Promise.allSettled([
      customerEmail,
      notifyAssignees(booking, kind),
      sendTripChangeAdminEmail(booking, kind),
    ]);
    for (const result of results) {
      if (result.status === "rejected") {
        console.error("Customer trip notification failed:", result.reason);
      }
    }
  } catch (error) {
    console.error("Customer trip notifications failed:", error);
  }
}
