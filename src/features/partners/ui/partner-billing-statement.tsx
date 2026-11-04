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

function formatWhen(value?: string) {
  return value ? new Date(value).toLocaleString() : "—";
}

export function PartnerBillingStatement({
  lines,
  formatMoney,
  emptyLabel,
  regionLabel,
  columns,
  entryLabel,
}: {
  lines: StatementLine[];
  formatMoney: (amount: number | undefined) => string;
  emptyLabel: string;
  regionLabel: string;
  columns: [string, string, string, string, string, string];
  entryLabel: (type: string) => string;
}) {
  if (lines.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  const amounts: [string, (line: StatementLine) => number | undefined][] = [
    [columns[1], (line) => line.fare],
    [columns[2], (line) => line.margin],
    [columns[3], (line) => line.partnerShare],
    [columns[4], (line) => line.balanceDelta],
  ];

  return (
    <>
      <div className="drawer-ledger-cards">
        {lines.map((line) => (
          <div
            key={line._id}
            className="rounded-md border border-border p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium break-words">
                  {entryLabel(line.type)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatWhen(line.createdAt)}
                </p>
              </div>
              <p className="num shrink-0 font-medium">
                {formatMoney(line.runningBalance)}
              </p>
            </div>
            <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              {amounts.map(([label, read]) => (
                <div key={label}>
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="num">{formatMoney(read(line))}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>

      <div
        tabIndex={0}
        aria-label={regionLabel}
        className="drawer-ledger-table overflow-x-auto rounded-md border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
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
                    {formatWhen(line.createdAt)}
                  </p>
                </td>
                <td className="num px-3 py-3">{formatMoney(line.fare)}</td>
                <td className="num px-3 py-3">{formatMoney(line.margin)}</td>
                <td className="num px-3 py-3">{formatMoney(line.partnerShare)}</td>
                <td className="num px-3 py-3">{formatMoney(line.balanceDelta)}</td>
                <td className="num px-3 py-3 font-medium">{formatMoney(line.runningBalance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
