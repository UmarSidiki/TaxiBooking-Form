import { Document, Image, Page, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { invoicePdfStyles as styles } from "@/features/booking/lib/invoice-pdf-styles";
import { invoiceFontFamily } from "@/features/invoices/lib/invoice-fonts";
import { invoiceCopy, invoiceLineLabel, invoiceLocale, invoicePaymentMethodLabel } from "@/features/invoices/lib/invoice-labels";

export type InvoiceSource = {
  tripId: string;
  locale?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
  vatId?: string;
  pickup: string;
  dropoff?: string;
  stops?: Array<{ location: string; order?: number }>;
  bookingType?: string;
  tripType?: string;
  duration?: number;
  date: string;
  time: string;
  returnDate?: string;
  returnTime?: string;
  passengers: number;
  flightNumber?: string;
  childSeats?: number;
  babySeats?: number;
  meetAndGreet?: boolean;
  selectedVehicle?: string;
  vehicleDetails?: { name?: string; price?: string; seats?: string };
  totalAmount?: number;
  subtotalAmount?: number;
  taxAmount?: number;
  taxPercentage?: number;
  taxIncluded?: boolean;
  paymentStatus?: string;
  paymentMethod?: string;
  fareLines?: { code: string; amount: number }[];
  depositDue?: number;
  balanceDue?: number;
  refundAmount?: number;
  paymentDate?: string;
};

export type InvoicePdfOptions = {
  invoiceNumber?: string;
  qrDataUrl?: string;
  payUrl?: string;
  brandColor?: string;
  logoDataUrl?: string;
  legalName?: string;
  address?: string;
  taxId?: string;
  regNo?: string;
  taxRate?: number;
  taxInclusive?: boolean;
  invoiceFooter?: string;
  invoiceTerms?: string;
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankIBAN?: string;
  bankSwiftBIC?: string;
  companyName?: string;
  companyPhone?: string;
};

const ink = "#1c1917";
const paper = "#fffaf5";
const muted = "#57534e";

function latin(value: string | number) {
  return `\u200E${value}\u200E`;
}

function money(symbol: string, amount: number) {
  return latin(`${symbol} ${amount.toFixed(2)}`);
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
  const paid = booking.paymentStatus === "completed";
  const refunded = booking.paymentStatus === "refunded";
  const due = booking.balanceDue ?? 0;
  const deposit = booking.depositDue ?? 0;
  const refund = booking.refundAmount ?? 0;
  const status = refunded ? copy.refunded ?? "Refunded" : paid ? copy.paid : copy.unpaid;
  const badgeBg = refunded ? "#fee2e2" : paid ? "#dcfce7" : "#ffedd5";
  const badgeInk = refunded ? "#991b1b" : paid ? "#166534" : "#9a3412";
  const rtl = invoiceLocale(booking.locale) === "ar";
  const fontFamily = invoiceFontFamily(booking.locale);
  const lines = (booking.fareLines ?? []).filter((row) => row.code !== "tax" && row.amount !== 0);
  const hourly = booking.bookingType === "hourly";
  const legalName = options.legalName || companyName;
  const address = options.address || "";
  const taxRate = options.taxRate ?? booking.taxPercentage ?? 0;
  const taxInclusive = options.taxInclusive ?? booking.taxIncluded ?? false;
  const rate = taxRate / 100;
  const rawLines = lines.length > 0 ? lines : [{ code: "vehicle", amount: booking.subtotalAmount ?? total }];
  // Compute per-line net/tax/gross. No separate Tax line item.
  type ComputedLine = { code: string; amount: number; net: number; tax: number; gross: number };
  const computed: ComputedLine[] = rawLines.map((row) => {
    const amt = row.amount;
    if (taxInclusive && rate > 0) {
      const gross = amt;
      const net = amt / (1 + rate);
      return { code: row.code, amount: amt, net, tax: gross - net, gross };
    }
    if (!taxInclusive && rate > 0) {
      const net = amt;
      const tax = net * rate;
      return { code: row.code, amount: amt, net, tax, gross: net + tax };
    }
    return { code: row.code, amount: amt, net: amt, tax: 0, gross: amt };
  });
  // Round to cents; keep net+tax=gross per line; put rounding remainder on largest line.
  const roundedLines: ComputedLine[] = computed.map((c) => {
    if (taxInclusive && rate > 0) {
      const netR = Math.round(c.net * 100) / 100;
      return { code: c.code, amount: c.amount, net: netR, tax: Math.round((c.gross - netR) * 100) / 100, gross: Math.round(c.gross * 100) / 100 };
    }
    if (!taxInclusive && rate > 0) {
      const taxR = Math.round(c.tax * 100) / 100;
      return { code: c.code, amount: c.amount, net: Math.round(c.net * 100) / 100, tax: taxR, gross: Math.round((c.net + taxR) * 100) / 100 };
    }
    const v = Math.round(c.net * 100) / 100;
    return { code: c.code, amount: c.amount, net: v, tax: 0, gross: v };
  });
  // Adjust largest line so sum gross equals booking total.
  const grossSum = roundedLines.reduce((s, l) => s + l.gross, 0);
  const remainder = Math.round((total - grossSum) * 100) / 100;
  if (remainder !== 0 && roundedLines.length > 0) {
    let largestIdx = 0;
    for (let i = 1; i < roundedLines.length; i++) {
      if (Math.abs(roundedLines[i].gross) > Math.abs(roundedLines[largestIdx].gross)) largestIdx = i;
    }
    const l = roundedLines[largestIdx];
    l.tax = Math.round((l.tax + remainder) * 100) / 100;
    l.gross = Math.round((l.net + l.tax) * 100) / 100;
  }
  const netSum = roundedLines.reduce((s, l) => s + l.net, 0);
  const taxSum = roundedLines.reduce((s, l) => s + l.tax, 0);
  const grossTotal = roundedLines.reduce((s, l) => s + l.gross, 0);
  const dueNow = paid ? (due > 0 ? due : 0) : deposit > 0 ? deposit : total;
  const balance = paid ? (due > 0 ? due : 0) : deposit > 0 ? Math.max(0, total - deposit) : total;

  const invoiceNo = options.invoiceNumber || booking.tripId;
  const issueDate = new Date().toISOString().slice(0, 10);
  const serviceDate = booking.date;
  const dueDate = booking.date;

  const stops = (booking.stops ?? []).filter((s) => s.location?.trim());

  return (
    <Document>
      <Page size="A4" style={[styles.page, { fontFamily }, rtl ? { direction: "rtl" } : {}]}>
        <View style={[styles.band, { backgroundColor: brand }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            {options.logoDataUrl ? <Image src={options.logoDataUrl} style={styles.logo} /> : null}
            <View>
              <Text style={[styles.brand, { color: inkOnBrand }]}>{legalName}</Text>
              {address ? <Text style={[styles.kicker, { color: inkOnBrand }]}>{address}</Text> : null}
              {options.companyPhone ? <Text style={[styles.kicker, { color: inkOnBrand }]}>{options.companyPhone}</Text> : null}
              {options.taxId ? <Text style={[styles.kicker, { color: inkOnBrand }]}>{copy.taxId ?? "Tax ID"}: {latin(options.taxId)}</Text> : null}
              {options.regNo ? <Text style={[styles.kicker, { color: inkOnBrand }]}>{copy.regNo ?? "Reg. no."}: {latin(options.regNo)}</Text> : null}
            </View>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={[styles.brand, { color: inkOnBrand }]}>{copy.invoice}</Text>
            <Text style={[styles.kicker, { color: inkOnBrand }]}>{latin(invoiceNo)}</Text>
            <Text style={[styles.badge, { backgroundColor: badgeBg, color: badgeInk, marginTop: 6 }]}>{status}</Text>
          </View>
        </View>
        <View style={styles.body}>
          <View style={styles.meta}>
            <View style={{ alignItems: "flex-start" }}>
              <Text style={styles.muted}>{copy.issueDate ?? "Issue date"}: {latin(issueDate)}</Text>
              <Text style={styles.muted}>{copy.serviceDate ?? "Service date"}: {latin(serviceDate)}</Text>
              <Text style={styles.muted}>{copy.dueDate ?? "Due date"}: {latin(dueDate)}</Text>
            </View>
          </View>

          <View style={styles.columns}>
            <View style={styles.column}>
              <Text style={styles.label}>{copy.billTo}</Text>
              <Text>{booking.firstName} {booking.lastName}</Text>
              {booking.company ? <Text style={styles.muted}>{booking.company}</Text> : null}
              {booking.vatId ? <Text style={styles.muted}>{copy.vatId ?? "VAT"}: {latin(booking.vatId)}</Text> : null}
              <Text style={styles.muted}>{latin(booking.email)}</Text>
              <Text style={styles.muted}>{latin(booking.phone)}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>{copy.trip}</Text>
              <Text style={styles.muted}>{copy.tripId ?? "Trip ID"}: {latin(booking.tripId)}</Text>
              <Text>{copy.from}: {booking.pickup}</Text>
              {stops.map((s, i) => (
                <Text key={i} style={styles.muted}>{copy.stop ?? "Stop"} {i + 1}: {s.location}</Text>
              ))}
              {hourly ? <Text>{copy.hours}: {booking.duration ?? "—"}</Text> : <Text>{copy.to}: {booking.dropoff || "—"}</Text>}
              <Text style={styles.muted}>{copy.when}: {latin(`${booking.date} ${booking.time}`)}</Text>
              {booking.tripType === "roundtrip" && booking.returnDate ? (
                <Text style={styles.muted}>{copy.return}: {latin(`${booking.returnDate} ${booking.returnTime || ""}`)}</Text>
              ) : null}
              <Text style={styles.muted}>{copy.passengers}: {booking.passengers}</Text>
              {booking.flightNumber ? <Text style={styles.muted}>{copy.flightNo ?? "Flight no."}: {latin(booking.flightNumber)}</Text> : null}
              {booking.vehicleDetails?.name ? <Text style={styles.muted}>{copy.vehicle ?? "Vehicle"}: {booking.vehicleDetails.name}</Text> : null}
            </View>
          </View>

          <View style={styles.tableHead}>
            <Text style={[styles.headText, { flex: 3 }]}>{copy.description}</Text>
            <Text style={[styles.headText, { flex: 1, textAlign: "right" }]}>{copy.qty ?? "Qty"}</Text>
            <Text style={[styles.headText, { flex: 1, textAlign: "right" }]}>{copy.unit ?? "Unit"}</Text>
            <Text style={[styles.headText, { flex: 1, textAlign: "right" }]}>{copy.net ?? "Net"}</Text>
            <Text style={[styles.headText, { flex: 1, textAlign: "right" }]}>{copy.taxRate ?? "Tax %"}</Text>
            <Text style={[styles.headText, { flex: 1, textAlign: "right" }]}>{copy.tax ?? "Tax"}</Text>
            <Text style={[styles.headText, { flex: 1, textAlign: "right" }]}>{copy.gross ?? "Gross"}</Text>
          </View>
          {roundedLines.map((row, idx) => (
            <View key={`${row.code}-${idx}`} style={styles.row}>
              <Text style={{ flex: 3 }}>{invoiceLineLabel(row.code, booking.locale)}</Text>
              <Text style={{ flex: 1, textAlign: "right" }}>{latin(1)}</Text>
              <Text style={{ flex: 1, textAlign: "right" }}>{money(currencySymbol, row.amount)}</Text>
              <Text style={{ flex: 1, textAlign: "right" }}>{money(currencySymbol, row.net)}</Text>
              <Text style={{ flex: 1, textAlign: "right" }}>{taxRate}%</Text>
              <Text style={{ flex: 1, textAlign: "right" }}>{money(currencySymbol, row.tax)}</Text>
              <Text style={{ flex: 1, textAlign: "right" }}>{money(currencySymbol, row.gross)}</Text>
            </View>
          ))}

          <View style={styles.totals}>
            <View style={styles.row}><Text>{copy.subtotal}</Text><Text>{money(currencySymbol, netSum)}</Text></View>
            {taxSum > 0 ? <View style={styles.row}><Text>{copy.tax} ({taxRate}%)</Text><Text>{money(currencySymbol, taxSum)}</Text></View> : null}
            <View style={styles.row}><Text>{copy.total}</Text><Text>{money(currencySymbol, grossTotal)}</Text></View>
            {deposit > 0 ? <View style={styles.row}><Text>{copy.deposit}</Text><Text>{money(currencySymbol, deposit)}</Text></View> : null}
            {paid ? <View style={styles.row}><Text>{copy.paidAmount ?? "Paid"}</Text><Text>{money(currencySymbol, total - (due > 0 ? due : 0))}</Text></View> : null}
            {paid && booking.paymentMethod ? <View style={styles.row}><Text>{copy.paymentMethod ?? "Method"}</Text><Text>{invoicePaymentMethodLabel(booking.paymentMethod, booking.locale)}</Text></View> : null}
            {refund > 0 ? <View style={styles.row}><Text>{copy.refunded ?? "Refunded"}</Text><Text>{money(currencySymbol, refund)}</Text></View> : null}
            <View style={styles.dueRow}><Text style={styles.dueLabel}>{copy.due}</Text><Text style={styles.dueLabel}>{money(currencySymbol, balance)}</Text></View>
          </View>

          {!paid && !refunded ? <Text style={styles.note}>{copy.cashNote}</Text> : null}
          {options.invoiceTerms ? <Text style={styles.note}>{options.invoiceTerms}</Text> : null}

          {!paid && options.qrDataUrl ? (
            <View style={styles.payRow}>
              <Image src={options.qrDataUrl} style={styles.qr} />
              <View style={styles.payCopy}>
                <Text style={styles.label}>{copy.pay}</Text>
                {options.payUrl ? <Text style={styles.payUrl}>{latin(options.payUrl)}</Text> : null}
              </View>
            </View>
          ) : null}

          {options.invoiceFooter ? <Text style={[styles.note, { marginTop: 8 }]}>{options.invoiceFooter}</Text> : null}

          {options.bankIBAN && (booking.paymentMethod === "bank_transfer" || balance > 0) ? (
            <View style={{ marginTop: 12 }}>
              <Text style={styles.label}>{copy.bankDetails ?? "Bank details"}</Text>
              {options.bankName ? <Text style={styles.muted}>{options.bankName}</Text> : null}
              {options.bankAccountName ? <Text style={styles.muted}>{options.bankAccountName}</Text> : null}
              {options.bankAccountNumber ? <Text style={styles.muted}>{latin(options.bankAccountNumber)}</Text> : null}
              {options.bankIBAN ? <Text style={styles.muted}>{latin(options.bankIBAN)}</Text> : null}
              {options.bankSwiftBIC ? <Text style={styles.muted}>{latin(options.bankSwiftBIC)}</Text> : null}
            </View>
          ) : null}
        </View>
        <View style={[styles.footer, { backgroundColor: brand }]}>
          <Text style={{ color: inkOnBrand }}>{copy.footer}</Text>
          <Text style={{ color: inkOnBrand }}>{copy.pageXofY ?? "Page 1 of 1"}</Text>
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