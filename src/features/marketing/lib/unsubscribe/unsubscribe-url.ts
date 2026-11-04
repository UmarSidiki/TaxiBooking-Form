export function unsubscribePageUrl(
  baseUrl: string,
  locale: string,
  token: string,
): string {
  const base = baseUrl.trim().replace(/\/+$/, "");
  if (!base || !token) return "";
  return `${base}/${locale}/u/${encodeURIComponent(token)}`;
}
