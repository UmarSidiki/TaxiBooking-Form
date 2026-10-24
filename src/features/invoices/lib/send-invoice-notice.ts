import { buildInvoicePdf } from "@/features/invoices/lib/build-invoice-pdf";
import { Booking } from "@/features/booking/model";
import { sendEmail } from "@/features/settings/lib/email";
import { sendWhatsAppTexts } from "@/features/settings/lib/whatsapp-session";
import { toWhatsAppJid } from "@/features/settings/lib/whatsapp-phone";
import { invoiceCopy } from "@/features/invoices/lib/invoice-labels";

export async function sendInvoiceNotice(tripId: string, force = false) {
  const booking = await Booking.findOne({ tripId });
  if (!booking) return { ok: false as const, error: "not_found" };
  if (!force && booking.invoiceNotifiedAt) return { ok: true as const, skipped: true };
  const built = await buildInvoicePdf(tripId);
  if (!built) return { ok: false as const, error: "not_found" };
  const copy = invoiceCopy(booking.locale);
  const filename = `${built.invoiceNumber || tripId}.pdf`;
  const emailed = await sendEmail({
    to: booking.email,
    subject: `${copy.invoice} ${built.invoiceNumber || tripId}`,
    text: `${copy.invoice} ${built.invoiceNumber || tripId}`,
    attachments: [{ filename, content: built.pdf, contentType: "application/pdf" }],
  });
  const digits = String(booking.phone || "").replace(/\D/g, "");
  if (digits) {
    await sendWhatsAppTexts([
      {
        jid: toWhatsAppJid(digits),
        text: `${copy.invoice} ${built.invoiceNumber || tripId}`,
        document: { base64: built.pdf.toString("base64"), fileName: filename },
      },
    ]);
  }
  await Booking.updateOne({ _id: booking._id }, { $set: { invoiceNotifiedAt: new Date() } });
  return { ok: true as const, emailed };
}
