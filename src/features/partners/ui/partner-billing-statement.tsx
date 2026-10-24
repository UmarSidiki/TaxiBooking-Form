"use client";

export type StatementLine = {
  _id: string;
  type: string;
  createdAt?: string;
  fare?: number;
  margin?: number;
  partnerShare?: number;
  balanceDelta: number;
  runningBalance: number;
  note?: string;
  reference?: string;
};

export function PartnerBillingStatement({
  lines,
  formatMoney,
  emptyLabel,
  columns,
  entryLabel,
}: {
  lines: StatementLine[];
  formatMoney: (amount: number | undefined) => string;
  emptyLabel: string;
  columns: [string, string, string, string, string, string];
  entryLabel: (type: string) => string;
}) {
  if (lines.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full min-w-[40rem] text-sm">
        <thead className="bg-muted/60">
          <tr>
            {columns.map((label) => (
              <th key={label} scope="col" className="px-3 py-2 text-start font-medium">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line._id} className="border-t border-border">
              <td className="px-3 py-3">
                <p className="font-medium">{entryLabel(line.type)}</p>
                <p className="text-xs text-muted-foreground">
                  {line.createdAt ? new Date(line.createdAt).toLocaleString() : "—"}
                </p>
              </td>
              <td className="px-3 py-3 tabular-nums">{formatMoney(line.fare)}</td>
              <td className="px-3 py-3 tabular-nums">{formatMoney(line.margin)}</td>
              <td className="px-3 py-3 tabular-nums">{formatMoney(line.partnerShare)}</td>
              <td className="px-3 py-3 tabular-nums">{formatMoney(line.balanceDelta)}</td>
              <td className="px-3 py-3 font-medium tabular-nums">{formatMoney(line.runningBalance)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
