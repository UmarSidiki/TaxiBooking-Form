import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { statementCopy } from "@/features/corporate/lib/statement-labels";
import { invoiceFontFamily } from "@/features/invoices/lib/invoice-fonts";

export type StatementRow = {
  tripId: string;
  date: string;
  time: string;
  pickup: string;
  dropoff?: string;
  totalAmount?: number;
  paymentStatus?: string;
};

const styles = StyleSheet.create({
  page: { fontSize: 10, color: "#1c1917" },
  band: { backgroundColor: "#B45309", color: "#fffaf5", paddingHorizontal: 36, paddingVertical: 22 },
  title: { fontSize: 20, fontWeight: 700 },
  body: { padding: 36 },
  meta: { marginBottom: 14, color: "#57534e" },
  head: { flexDirection: "row", backgroundColor: "#f5f5f4", padding: 6 },
  row: { flexDirection: "row", borderBottomWidth: 0.4, borderBottomColor: "#e7e5e4", padding: 6 },
  trip: { width: "18%" },
  when: { width: "22%" },
  route: { width: "40%" },
  amount: { width: "20%", textAlign: "right" },
  total: { marginTop: 12, fontSize: 14, fontWeight: 700, textAlign: "right" },
  footer: { position: "absolute", bottom: 24, left: 36, right: 36, color: "#57534e", fontSize: 9 },
});

function StatementDocument({
  companyName,
  accountName,
  month,
  rows,
  total,
  symbol,
  locale,
}: {
  companyName: string;
  accountName: string;
  month: string;
  rows: StatementRow[];
  total: number;
  symbol: string;
  locale?: string | null;
}) {
  const copy = statementCopy(locale);
  return (
    <Document>
      <Page size="A4" style={[styles.page, { fontFamily: invoiceFontFamily(locale) }]}>
        <View style={styles.band}>
          <Text style={styles.title}>{copy.title}</Text>
          <Text>{companyName}</Text>
        </View>
        <View style={styles.body}>
          <Text style={styles.meta}>{copy.account}: {accountName}</Text>
          <Text style={styles.meta}>{copy.period}: {month}</Text>
          <View style={styles.head}>
            <Text style={styles.trip}>{copy.trip}</Text>
            <Text style={styles.when}>{copy.when}</Text>
            <Text style={styles.route}>{copy.route}</Text>
            <Text style={styles.amount}>{copy.amount}</Text>
          </View>
          {rows.map((row) => (
            <View key={row.tripId} style={styles.row}>
              <Text style={styles.trip}>{row.tripId}</Text>
              <Text style={styles.when}>{row.date} {row.time}</Text>
              <Text style={styles.route}>{row.pickup}{row.dropoff ? ` → ${row.dropoff}` : ""}</Text>
              <Text style={styles.amount}>{symbol}{(row.totalAmount ?? 0).toFixed(2)}</Text>
            </View>
          ))}
          <Text style={styles.total}>{copy.total} {symbol}{total.toFixed(2)}</Text>
        </View>
        <Text style={styles.footer}>{copy.footer}</Text>
      </Page>
    </Document>
  );
}

export function renderStatementPdf(input: {
  companyName: string;
  accountName: string;
  month: string;
  rows: StatementRow[];
  total: number;
  symbol: string;
  locale?: string | null;
}) {
  return renderToBuffer(<StatementDocument {...input} />);
}
