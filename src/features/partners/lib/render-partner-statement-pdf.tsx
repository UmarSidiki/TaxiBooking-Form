import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";

export type StatementPdfLine = {
  createdAt?: Date | string;
  type: string;
  fare?: number;
  margin?: number;
  partnerShare?: number;
  balanceDelta: number;
  runningBalance: number;
  note?: string;
};

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10 },
  title: { fontSize: 20, marginBottom: 4 },
  line: { marginBottom: 3 },
  row: { flexDirection: "row", borderBottomWidth: 0.5, paddingVertical: 4 },
  cell: { width: "16%" },
  wide: { width: "20%" },
});

function money(symbol: string, amount: number | undefined) {
  if (typeof amount !== "number") return "—";
  return `${symbol}${amount.toFixed(2)}`;
}

function StatementDocument({
  partnerName,
  month,
  currencySymbol,
  lines,
  closingBalance,
}: {
  partnerName: string;
  month: string;
  currencySymbol: string;
  lines: StatementPdfLine[];
  closingBalance: number;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Partner statement</Text>
        <Text style={styles.line}>{partnerName}</Text>
        <Text style={styles.line}>{month}</Text>
        <View style={styles.row}>
          <Text style={styles.wide}>When</Text>
          <Text style={styles.cell}>Fare</Text>
          <Text style={styles.cell}>Margin</Text>
          <Text style={styles.cell}>Share</Text>
          <Text style={styles.cell}>Change</Text>
          <Text style={styles.cell}>Balance</Text>
        </View>
        {lines.map((line, index) => (
          <View key={`${line.type}-${index}`} style={styles.row}>
            <Text style={styles.wide}>{line.type}</Text>
            <Text style={styles.cell}>{money(currencySymbol, line.fare)}</Text>
            <Text style={styles.cell}>{money(currencySymbol, line.margin)}</Text>
            <Text style={styles.cell}>{money(currencySymbol, line.partnerShare)}</Text>
            <Text style={styles.cell}>{money(currencySymbol, line.balanceDelta)}</Text>
            <Text style={styles.cell}>{money(currencySymbol, line.runningBalance)}</Text>
          </View>
        ))}
        <Text style={{ marginTop: 12 }}>
          Closing balance {money(currencySymbol, closingBalance)}
        </Text>
      </Page>
    </Document>
  );
}

export function renderPartnerStatementPdf(input: {
  partnerName: string;
  month: string;
  currencySymbol: string;
  lines: StatementPdfLine[];
  closingBalance: number;
}) {
  return renderToBuffer(<StatementDocument {...input} />);
}
