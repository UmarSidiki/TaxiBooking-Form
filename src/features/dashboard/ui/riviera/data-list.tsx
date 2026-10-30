"use client";

import type { ReactNode } from "react";

export interface DataListColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

export function DataList<T extends { id?: string; _id?: string }>({
  rows,
  columns,
  mobileCard,
  empty,
}: {
  rows: T[];
  columns: DataListColumn<T>[];
  mobileCard?: (row: T) => ReactNode;
  empty?: ReactNode;
}) {
  if (rows.length === 0) return <>{empty}</>;
  return (
    <>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--rule)]">
              {columns.map((c) => (
                <th key={c.key} className={`px-3 py-2 text-left font-medium text-[var(--ink2)] ${c.className ?? ""}`}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id ?? row._id} className="border-b border-[var(--rule)]">
                {columns.map((c) => (
                  <td key={c.key} className={`px-3 py-2 ${c.className ?? ""}`}>
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {mobileCard && (
        <div className="flex flex-col gap-3 md:hidden">
          {rows.map((row) => (
            <div key={row.id ?? row._id}>{mobileCard(row)}</div>
          ))}
        </div>
      )}
    </>
  );
}