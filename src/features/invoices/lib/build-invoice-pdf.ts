import { readFile } from "node:fs/promises";
import { join } from "node:path";
import QRCode from "qrcode";
import { Booking } from "@/features/booking/model";
import { renderInvoicePdf } from "@/features/booking/lib/render-invoice-pdf";
import { ridePayUrl } from "@/features/invoices/lib/ride-pay-link";
import { allocateInvoiceNumber } from "@/features/invoices/lib/allocate-invoice-number";
import { Setting } from "@/features/settings/model";
import { getCurrencySymbol } from "@/shared/lib/utils";
import { resolvePublicUrl } from "@/features/settings/lib/public-url";

async function logoDataUrl(settings: { companyLogoUrl?: string } | null) {
  const url = settings?.companyLogoUrl?.trim();
  if (url) {
    try {
      if (url.startsWith("data:")) return url;
      const res = await fetch(url);
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        const type = res.headers.get("content-type") || "image/png";
        return `data:${type};base64,${buf.toString("base64")}`;
      }
    } catch {
      // fall through
    }
  }
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
  const [settings, invoiceNumber] = await Promise.all([
    Setting.findOne().lean(),
    allocateInvoiceNumber(String(booking._id)),
  ]);
  const logoUrl = await logoDataUrl(settings);
  const currency = settings?.stripeCurrency?.toUpperCase() || "EUR";
  const symbol = getCurrencySymbol(currency);
  const base = await resolvePublicUrl();
  const payUrl = ridePayUrl(base, booking.locale, tripId);
  const qrDataUrl = payUrl ? await QRCode.toDataURL(payUrl, { margin: 1, width: 280 }) : undefined;
  const pdf = await renderInvoicePdf(booking, symbol, settings?.smtpSenderName || settings?.companyName || "Booking", {
    invoiceNumber: invoiceNumber ?? tripId,
    qrDataUrl,
    payUrl: payUrl ?? undefined,
    brandColor: settings?.primaryColor,
    logoDataUrl: logoUrl,
    legalName: settings?.legalName,
    address: settings?.address || settings?.companyAddress,
    taxId: settings?.taxId,
    regNo: settings?.regNo,
    taxRate: settings?.taxRate ?? settings?.taxPercentage,
    taxInclusive: settings?.taxInclusive ?? settings?.taxIncluded,
    invoiceFooter: settings?.invoiceFooter,
    invoiceTerms: settings?.invoiceTerms,
    bankName: settings?.bankName,
    bankAccountName: settings?.bankAccountName,
    bankAccountNumber: settings?.bankAccountNumber,
    bankIBAN: settings?.bankIBAN,
    bankSwiftBIC: settings?.bankSwiftBIC,
    companyName: settings?.companyName,
    companyPhone: settings?.companyPhone,
  });
  return { pdf, booking, invoiceNumber, payUrl };
}