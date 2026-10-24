import { Document, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { invoiceCopy, invoiceLineLabel } from "@/features/invoices/lib/invoice-labels";

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
  flightNumber?: string;
  totalAmount?: number;
  subtotalAmount?: number;
  taxAmount?: number;
  taxPercentage?: number;
  taxIncluded?: boolean;
  paymentStatus?: string;
  notes?: string;
  fareLines?: { code: string; amount: number }[];
};

export type InvoicePdfOptions = {
  invoiceNumber?: string;
  qrDataUrl?: string;
  payUrl?: string;
};

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, color: "#1c1917" },
  title: { fontSize: 22, marginBottom: 4 },
  muted: { fontSize: 9, color: "#57534e", marginBottom: 2 },
  section: { marginTop: 14 },
  row: { flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 0.4, borderBottomColor: "#e7e5e4", paddingVertical: 4 },
  qr: { width: 72, height: 72, marginTop: 8 },
});

function money(symbol: string, amount: number) {
  return `${symbol}${amount.toFixed(2)}`;
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
  const total = booking.totalAmount ?? 0;
  const paid = booking.paymentStatus === "completed";
  const lines = (booking.fareLines ?? []).filter((line) => line.code !== "tax" && line.amount !== 0);
  const hourly = booking.bookingType === "hourly";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{copy.invoice}</Text>
        <Text style={styles.muted}>{companyName}</Text>
        <Text style={styles.muted}>{copy.number}: {options.invoiceNumber || booking.tripId}</Text>
        <Text style={paid ? styles.muted : { ...styles.muted, color: "#9a3412" }}>{paid ? copy.paid : copy.unpaid}</Text>
        <View style={styles.section}>
          <Text>{copy.billTo}</Text>
          <Text style={styles.muted}>{booking.firstName} {booking.lastName}</Text>
          <Text style={styles.muted}>{booking.email}</Text>
          <Text style={styles.muted}>{booking.phone}</Text>
        </View>
        <View style={styles.section}>
          <Text>{copy.trip}</Text>
          <Text style={styles.muted}>{copy.from}: {booking.pickup}</Text>
          {hourly ? (
            <Text style={styles.muted}>{copy.hours}: {booking.duration ?? "—"}</Text>
          ) : (
            <Text style={styles.muted}>{copy.to}: {booking.dropoff || "—"}</Text>
          )}
          <Text style={styles.muted}>{copy.when}: {booking.date} {booking.time}</Text>
          {booking.tripType === "roundtrip" && booking.returnDate ? (
            <Text style={styles.muted}>{copy.return}: {booking.returnDate} {booking.returnTime || ""}</Text>
          ) : null}
          <Text style={styles.muted}>{copy.passengers}: {booking.passengers}</Text>
        </View>
        <View style={styles.section}>
          {lines.length > 0 ? lines.map((line) => (
            <View key={line.code} style={styles.row}>
              <Text>{invoiceLineLabel(line.code, booking.locale)}</Text>
              <Text>{money(currencySymbol, line.amount)}</Text>
            </View>
          )) : (
            <View style={styles.row}>
              <Text>{invoiceLineLabel("vehicle", booking.locale)}</Text>
              <Text>{money(currencySymbol, booking.subtotalAmount ?? total)}</Text>
            </View>
          )}
          {(booking.taxAmount ?? 0) > 0 ? (
            <View style={styles.row}>
              <Text>{copy.tax} ({booking.taxPercentage || 0}%)</Text>
              <Text>{money(currencySymbol, booking.taxAmount ?? 0)}</Text>
            </View>
          ) : null}
          <View style={styles.row}>
            <Text>{copy.total}</Text>
            <Text>{money(currencySymbol, total)}</Text>
          </View>
          <View style={styles.row}>
            <Text>{copy.due}</Text>
            <Text>{money(currencySymbol, paid ? 0 : total)}</Text>
          </View>
        </View>
        {options.qrDataUrl ? <Image src={options.qrDataUrl} style={styles.qr} /> : null}
        {options.payUrl ? <Text style={styles.muted}>{copy.pay}: {options.payUrl}</Text> : null}
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
