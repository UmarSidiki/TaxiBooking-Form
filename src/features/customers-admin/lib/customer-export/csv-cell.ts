/**
 * Spreadsheet formula injection guard. Excel/Sheets evaluate a cell that starts
 * with = + - @ (or a control character), so those values get a leading quote.
 */
const FORMULA_PREFIX = /^[=+\-@\t\r]/;

/** RFC 4180 quoting: any comma, quote or line break forces quotes. */
const NEEDS_QUOTES = /[",\r\n]/;

export function neutraliseCsvFormula(value: string): string {
  return FORMULA_PREFIX.test(value) ? `'${value}` : value;
}

export function csvCell(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? "" : String(value);
  const safe = neutraliseCsvFormula(text);
  return NEEDS_QUOTES.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function csvLine(
  cells: Array<string | number | null | undefined>,
): string {
  return `${cells.map(csvCell).join(",")}\r\n`;
}
