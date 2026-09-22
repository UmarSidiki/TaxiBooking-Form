import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";

export type InvoiceSource = {
  tripId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  pickup: string;
  dropoff?: string;
  bookingType?: string;
  duration?: number;
  date: string;
  time: string;
  passengers: number;
  flightNumber?: string;
  totalAmount?: number;
  subtotalAmount?: number;
  taxAmount?: number;
  taxPercentage?: number;
  taxIncluded?: boolean;
  paymentStatus?: string;
  notes?: string;
};

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10 },
  title: { fontSize: 22, marginBottom: 4 },
  line: { fontSize: 9, marginBottom: 3 },
  section: { marginTop: 16 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  label: { width: 160 },
  totals: { marginTop: 12, borderTopWidth: 1, paddingTop: 8 },
});

function money(symbol: string, amount: number) {
  return `${symbol}${amount.toFixed(2)}`;
}

function InvoiceDocument({
  booking,
  currencySymbol,
  companyName,
}: {
  booking: InvoiceSource;
  currencySymbol: string;
  companyName: string;
}) {
  const total = booking.totalAmount ?? 0;
  const tax = booking.taxAmount ?? 0;
  const subtotal = booking.subtotalAmount ?? total;
  const paid = booking.paymentStatus === "completed" ? total : 0;
  const hourly = booking.bookingType === "hourly";
  const issued = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Invoice</Text>
        <Text style={styles.line}>{companyName}</Text>
        <Text style={styles.line}>Invoice #{booking.tripId}</Text>
        <Text style={styles.line}>{issued}</Text>

        <View style={styles.section}>
          <Text>Bill to</Text>
          <Text style={styles.line}>
            {booking.firstName} {booking.lastName}
          </Text>
          <Text style={styles.line}>{booking.email}</Text>
          <Text style={styles.line}>{booking.phone}</Text>
        </View>

        <View style={styles.section}>
          <Text>Trip</Text>
          <Text style={styles.line}>From: {booking.pickup}</Text>
          {hourly ? (
            <Text style={styles.line}>
              Duration: {booking.duration ? `${booking.duration} hours` : "Hourly"}
            </Text>
          ) : (
            <Text style={styles.line}>To: {booking.dropoff || "—"}</Text>
          )}
          <Text style={styles.line}>
            {booking.date} at {booking.time}
          </Text>
          <Text style={styles.line}>Passengers: {booking.passengers}</Text>
          {booking.flightNumber ? (
            <Text style={styles.line}>Flight: {booking.flightNumber}</Text>
          ) : null}
        </View>

        <View style={styles.totals}>
          <View style={styles.row}>
            <Text style={styles.label}>Transportation</Text>
            <Text>{money(currencySymbol, subtotal)}</Text>
          </View>
          {tax > 0 ? (
            <View style={styles.row}>
              <Text style={styles.label}>
                Tax ({booking.taxPercentage || 0}%)
                {booking.taxIncluded ? " included" : ""}
              </Text>
              <Text>{money(currencySymbol, tax)}</Text>
            </View>
          ) : null}
          <View style={styles.row}>
            <Text style={styles.label}>Total</Text>
            <Text>{money(currencySymbol, total)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Amount paid</Text>
            <Text>{money(currencySymbol, paid)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Balance due</Text>
            <Text>{money(currencySymbol, total - paid)}</Text>
          </View>
        </View>

        {booking.notes ? (
          <View style={styles.section}>
            <Text>Notes</Text>
            <Text style={styles.line}>{booking.notes}</Text>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}

export function renderInvoicePdf(
  booking: InvoiceSource,
  currencySymbol: string,
  companyName: string
) {
  return renderToBuffer(
    <InvoiceDocument
      booking={booking}
      currencySymbol={currencySymbol}
      companyName={companyName}
    />
  );
}
