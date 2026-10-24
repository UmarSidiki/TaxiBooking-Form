import QRCode from "qrcode";
import { Booking } from "@/features/booking/model";
import { renderInvoicePdf } from "@/features/booking/lib/render-invoice-pdf";
import { absoluteHttpBase, invoiceDownloadUrl } from "@/features/booking/lib/booking-mail-url";
import { allocateInvoiceNumber } from "@/features/invoices/lib/allocate-invoice-number";
import { Setting } from "@/features/settings/model";
import { getCurrencySymbol } from "@/shared/lib/utils";

export async function buildInvoicePdf(tripId: string) {
  const booking = await Booking.findOne({ tripId });
  if (!booking) return null;
  const [settings, invoiceNumber] = await Promise.all([
    Setting.findOne().lean(),
    allocateInvoiceNumber(String(booking._id)),
  ]);
  const currency = settings?.stripeCurrency?.toUpperCase() || "EUR";
  const symbol = getCurrencySymbol(currency);
  const base = absoluteHttpBase(process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL);
  const link = invoiceDownloadUrl(base ?? undefined, tripId);
  const qrDataUrl = link ? await QRCode.toDataURL(link, { margin: 0, width: 160 }) : undefined;
  const pdf = await renderInvoicePdf(booking, symbol, settings?.smtpSenderName || "Booking", {
    invoiceNumber: invoiceNumber ?? tripId,
    qrDataUrl,
    payUrl: link ?? undefined,
  });
  return { pdf, booking, invoiceNumber, link };
}
