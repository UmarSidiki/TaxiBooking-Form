/** `YYYY-MM-DD` validation without a regex; rejects impossible dates. */
export function isDateOnly(value: string): boolean {
  if (value.length !== 10 || value[4] !== "-" || value[7] !== "-") return false;
  const parts = [value.slice(0, 4), value.slice(5, 7), value.slice(8, 10)];
  for (const part of parts) {
    for (const char of part) {
      if (char < "0" || char > "9") return false;
    }
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
