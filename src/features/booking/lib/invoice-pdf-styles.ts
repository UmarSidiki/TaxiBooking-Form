import { StyleSheet } from "@react-pdf/renderer";

const ink = "#1c1917";
const muted = "#57534e";
const line = "#e7e5e4";
const paper = "#fffaf5";

export const invoicePdfStyles = StyleSheet.create({
  page: { fontSize: 10, color: ink },
  band: { minHeight: 92, paddingHorizontal: 36, paddingTop: 24, paddingBottom: 18, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brand: { fontSize: 18, fontWeight: 700 },
  kicker: { fontSize: 11, marginTop: 4 },
  logo: { width: 48, height: 48, borderRadius: 8, objectFit: "cover" },
  body: { paddingHorizontal: 36, paddingTop: 22, paddingBottom: 24 },
  meta: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  number: { fontSize: 16, fontWeight: 700 },
  badge: { fontSize: 9, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  muted: { color: muted, marginTop: 2 },
  columns: { flexDirection: "row", gap: 16, marginTop: 18 },
  column: { flex: 1, padding: 10, backgroundColor: "#fafaf9", borderRadius: 6 },
  label: { fontSize: 8, color: muted, marginBottom: 4 },
  tableHead: { marginTop: 18, flexDirection: "row", justifyContent: "space-between", backgroundColor: "#f5f5f4", paddingHorizontal: 8, paddingVertical: 6 },
  headText: { fontSize: 8, color: muted },
  row: { flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 0.4, borderBottomColor: line, paddingHorizontal: 8, paddingVertical: 6 },
  totals: { marginTop: 8, marginLeft: 180 },
  dueRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 8, paddingVertical: 8, backgroundColor: paper },
  dueLabel: { fontWeight: 700, fontSize: 12 },
  note: { marginTop: 12, color: muted, fontSize: 9 },
  payRow: { marginTop: 16, flexDirection: "row", gap: 12, alignItems: "center" },
  qr: { width: 92, height: 92 },
  payCopy: { flex: 1 },
  payUrl: { fontSize: 8, color: muted, marginTop: 4 },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, minHeight: 42, paddingHorizontal: 36, paddingVertical: 12, flexDirection: "row", justifyContent: "space-between" },
});
