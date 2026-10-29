import { buildInvoicePdf } from "@/features/invoices/lib/build-invoice-pdf";
import { Booking } from "@/features/booking/model";
import { notify } from "@/features/notifications/notify";

export async function sendInvoiceNotice(tripId: string, force = false) {
  const booking = await Booking.findOne({ tripId });
  if (!booking) return { ok: false as const, error: "not_found" };
  if (!force && booking.invoiceNotifiedAt) return { ok: true as const, skipped: true };

  const built = await buildInvoicePdf(tripId);
  if (!built) return { ok: false as const, error: "not_found" };

  const invoiceNumber = built.invoiceNumber || tripId;
  const filename = `${invoiceNumber}.pdf`;
  const result = await notify("invoice_notice", {
    locale: booking.locale,
    customerEmail: booking.email,
    variables: {
      name: `${booking.firstName} ${booking.lastName}`.trim(),
      tripId: booking.tripId,
      invoiceNumber,
      total: typeof booking.totalAmount === "number" ? booking.totalAmount.toFixed(2) : "",
    },
    recipients: {
      customer: [{
        phone: booking.phone,
        email: booking.email,
        name: `${booking.firstName} ${booking.lastName}`.trim(),
        whatsappOptIn: booking.whatsappOptIn,
      }],
    },
    document: { base64: built.pdf.toString("base64"), fileName: filename },
  });

  if (result.queued > 0) {
    await Booking.updateOne({ _id: booking._id }, { $set: { invoiceNotifiedAt: new Date() } });
  }
  return {
    ok: true as const,
    emailed: result.deliveries.some((delivery) => delivery.channel === "email"),
  };
}
