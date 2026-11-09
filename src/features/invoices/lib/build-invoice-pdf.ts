import QRCode from "qrcode";
import { Booking } from "@/features/booking/model";
import { renderInvoicePdf } from "@/features/booking/lib/render-invoice-pdf";
import { ridePayUrl } from "@/features/invoices/lib/ride-pay-link";
import { allocateInvoiceNumber } from "@/features/invoices/lib/allocate-invoice-number";
import { logoDataUrl } from "@/features/invoices/lib/invoice-logo";
import { invoiceTaxFromSettings } from "@/features/invoices/lib/invoice-tax";
import { Setting } from "@/features/settings/model";
import { brandName } from "@/features/settings/lib/brand-name";
import { resolveBrandColors } from "@/features/settings/lib/brand-colors";
import { getCurrencySymbol } from "@/shared/lib/utils";
import { resolvePublicUrl } from "@/features/settings/lib/public-url";

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
  const tax = invoiceTaxFromSettings(settings);
  const pdf = await renderInvoicePdf(booking, symbol, brandName(settings) || "Booking", {
    invoiceNumber: invoiceNumber ?? tripId,
    qrDataUrl,
    payUrl: payUrl ?? undefined,
    brandColor: resolveBrandColors(settings).primary,
    logoDataUrl: logoUrl,
    legalName: settings?.legalName,
    address: settings?.address || settings?.companyAddress,
    taxId: settings?.taxId,
    regNo: settings?.regNo,
    taxRate: tax.taxRate,
    taxInclusive: tax.taxInclusive,
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