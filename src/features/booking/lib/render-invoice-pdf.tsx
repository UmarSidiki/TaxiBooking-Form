import { Document, Image, Page, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { invoicePdfStyles as styles } from "@/features/booking/lib/invoice-pdf-styles";
import { invoiceFontFamily } from "@/features/invoices/lib/invoice-fonts";
import { invoiceCopy, invoiceLineLabel, invoiceLocale } from "@/features/invoices/lib/invoice-labels";

export type InvoiceSource = {
  tripId: string;
  locale?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  pickup: string;
  dropoff?: string;
  bookingType?: string;
  tripType?: string;
  duration?: number;
  date: string;
  time: string;
  returnDate?: string;
  returnTime?: string;
  passengers: number;
  totalAmount?: number;
  subtotalAmount?: number;
  taxAmount?: number;
  taxPercentage?: number;
  paymentStatus?: string;
  paymentMethod?: string;
  fareLines?: { code: string; amount: number }[];
  depositDue?: number;
  balanceDue?: number;
};

export type InvoicePdfOptions = {
  invoiceNumber?: string;
  qrDataUrl?: string;
  payUrl?: string;
  brandColor?: string;
  logoDataUrl?: string;
};

const ink = "#1c1917";
const paper = "#fffaf5";

function latin(value: string | number) {
  return `\u200E${value}\u200E`;
}

function money(symbol: string, amount: number) {
  return latin(`${symbol}${amount.toFixed(2)}`);
}

function onBrand(hex: string) {
  const n = Number.parseInt(hex.slice(1), 16);
  const y = (((n >> 16) & 255) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000;
  return y > 160 ? ink : paper;
}

function InvoiceDocument({
  booking,
  currencySymbol,
  companyName,
  options,
}: {
  booking: InvoiceSource;
  currencySymbol: string;
  companyName: string;
  options: InvoicePdfOptions;
}) {
  const copy = invoiceCopy(booking.locale);
  const brand = options.brandColor && /^#[0-9a-f]{6}$/i.test(options.brandColor) ? options.brandColor : "#B45309";
  const inkOnBrand = onBrand(brand);
  const total = booking.totalAmount ?? 0;
  const deposit = booking.depositDue ?? 0;
  const storedBalance = booking.balanceDue ?? 0;
  const paid = booking.paymentStatus === "completed";
  const partial = paid && storedBalance > 0;
  const balance = deposit > 0 ? storedBalance : paid ? 0 : total;
  const dueNow = paid ? (storedBalance > 0 ? storedBalance : 0) : deposit > 0 ? deposit : total;
  const lines = (booking.fareLines ?? []).filter((row) => row.code !== "tax" && row.amount !== 0);
  const hourly = booking.bookingType === "hourly";
  const badge = partial ? copy.partial : paid ? copy.paid : copy.unpaid;
  const badgeBg = partial ? "#dbeafe" : paid ? "#dcfce7" : "#ffedd5";
  const badgeInk = partial ? "#1e3a8a" : paid ? "#166534" : "#9a3412";
  const rtl = invoiceLocale(booking.locale) === "ar";
  const fontFamily = invoiceFontFamily(booking.locale);

  return (
    <Document>
      <Page size="A4" style={[styles.page, { fontFamily }, rtl ? { direction: "rtl" } : {}]}>
        <View style={[styles.band, { backgroundColor: brand }]}>
          <View>
            <Text style={[styles.brand, { color: inkOnBrand }]}>{companyName}</Text>
            <Text style={[styles.kicker, { color: inkOnBrand }]}>{copy.invoice}</Text>
          </View>
          {options.logoDataUrl ? <Image src={options.logoDataUrl} style={styles.logo} /> : null}
        </View>
        <View style={styles.body}>
          <View style={styles.meta}>
            <View>
              <Text style={styles.number}>{latin(options.invoiceNumber || booking.tripId)}</Text>
              <Text style={styles.muted}>{copy.number} · {latin(booking.tripId)}</Text>
            </View>
            <Text style={[styles.badge, { backgroundColor: badgeBg, color: badgeInk }]}>{badge}</Text>
          </View>
          <View style={styles.columns}>
            <View style={styles.column}>
              <Text style={styles.label}>{copy.billTo}</Text>
              <Text>{booking.firstName} {booking.lastName}</Text>
              <Text style={styles.muted}>{latin(booking.email)}</Text>
              <Text style={styles.muted}>{latin(booking.phone)}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>{copy.trip}</Text>
              <Text>{copy.from}: {booking.pickup}</Text>
              {hourly ? <Text>{copy.hours}: {booking.duration ?? "—"}</Text> : <Text>{copy.to}: {booking.dropoff || "—"}</Text>}
              <Text style={styles.muted}>{copy.when}: {latin(`${booking.date} ${booking.time}`)}</Text>
              {booking.tripType === "roundtrip" && booking.returnDate ? (
                <Text style={styles.muted}>{copy.return}: {latin(`${booking.returnDate} ${booking.returnTime || ""}`)}</Text>
              ) : null}
              <Text style={styles.muted}>{copy.passengers}: {booking.passengers}</Text>
            </View>
          </View>
          <View style={styles.tableHead}>
            <Text style={styles.headText}>{copy.description}</Text>
            <Text style={styles.headText}>{copy.amount}</Text>
          </View>
          {(lines.length > 0 ? lines : [{ code: "vehicle", amount: booking.subtotalAmount ?? total }]).map((row) => (
            <View key={row.code} style={styles.row}>
              <Text>{invoiceLineLabel(row.code, booking.locale)}</Text>
              <Text>{money(currencySymbol, row.amount)}</Text>
            </View>
          ))}
          {(booking.taxAmount ?? 0) > 0 ? (
            <View style={styles.row}>
              <Text>{copy.tax} ({booking.taxPercentage || 0}%)</Text>
              <Text>{money(currencySymbol, booking.taxAmount ?? 0)}</Text>
            </View>
          ) : null}
          <View style={styles.totals}>
            <View style={styles.row}><Text>{copy.total}</Text><Text>{money(currencySymbol, total)}</Text></View>
            {deposit > 0 ? <View style={styles.row}><Text>{copy.deposit}</Text><Text>{money(currencySymbol, deposit)}</Text></View> : null}
            <View style={styles.row}><Text>{copy.dueNow}</Text><Text>{money(currencySymbol, dueNow)}</Text></View>
            <View style={styles.dueRow}><Text style={styles.dueLabel}>{copy.due}</Text><Text style={styles.dueLabel}>{money(currencySymbol, balance)}</Text></View>
          </View>
          {!paid ? <Text style={styles.note}>{copy.cashNote}</Text> : null}
          <View style={styles.payRow}>
            {options.qrDataUrl ? <Image src={options.qrDataUrl} style={styles.qr} /> : null}
            <View style={styles.payCopy}>
              <Text style={styles.label}>{copy.pay}</Text>
              {options.payUrl ? <Text style={styles.payUrl}>{latin(options.payUrl)}</Text> : null}
            </View>
          </View>
        </View>
        <View style={[styles.footer, { backgroundColor: brand }]}>
          <Text style={{ color: inkOnBrand }}>{copy.footer}</Text>
          <Text style={{ color: inkOnBrand }}>{companyName}</Text>
        </View>
      </Page>
    </Document>
  );
}

export function renderInvoicePdf(
  booking: InvoiceSource,
  currencySymbol: string,
  companyName: string,
  options: InvoicePdfOptions = {},
) {
  return renderToBuffer(
    <InvoiceDocument booking={booking} currencySymbol={currencySymbol} companyName={companyName} options={options} />,
  );
}
