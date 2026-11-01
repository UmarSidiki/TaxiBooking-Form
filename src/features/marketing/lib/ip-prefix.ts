/** Coarse network signal for consent records; never the full address. */
export function ipPrefixFromValue(value: string | null | undefined): string {
  const first = (value ?? "").split(",")[0]?.trim();
  if (!first) return "";
  return first.includes(":")
    ? first.split(":").slice(0, 4).join(":")
    : first.split(".").slice(0, 2).join(".");
}
