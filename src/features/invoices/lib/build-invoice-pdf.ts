import { readFile } from "node:fs/promises";
import { join } from "node:path";
import QRCode from "qrcode";
import { Booking } from "@/features/booking/model";
import { renderInvoicePdf } from "@/features/booking/lib/render-invoice-pdf";
import { ridePayUrl } from "@/features/invoices/lib/ride-pay-link";
import { allocateInvoiceNumber } from "@/features/invoices/lib/allocate-invoice-number";
import { Setting } from "@/features/settings/model";
import { getCurrencySymbol } from "@/shared/lib/utils";

async function logoDataUrl() {
  try {
    const bytes = await readFile(join(process.cwd(), "public/icon.png"));
    return `data:image/png;base64,${bytes.toString("base64")}`;
  } catch {
    return undefined;
  }
}

export async function buildInvoicePdf(tripId: string) {
  const booking = await Booking.findOne({ tripId });
  if (!booking) return null;
  const [settings, invoiceNumber, logo] = await Promise.all([
    Setting.findOne().lean(),
    allocateInvoiceNumber(String(booking._id)),
    logoDataUrl(),
  ]);
  const currency = settings?.stripeCurrency?.toUpperCase() || "EUR";
  const symbol = getCurrencySymbol(currency);
  const base = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL;
  const payUrl = ridePayUrl(base, booking.locale, tripId);
  const qrDataUrl = payUrl ? await QRCode.toDataURL(payUrl, { margin: 1, width: 280 }) : undefined;
  const pdf = await renderInvoicePdf(booking, symbol, settings?.smtpSenderName || "Booking", {
    invoiceNumber: invoiceNumber ?? tripId,
    qrDataUrl,
    payUrl: payUrl ?? undefined,
    brandColor: settings?.primaryColor,
    logoDataUrl: logo,
  });
  return { pdf, booking, invoiceNumber, payUrl };
}
