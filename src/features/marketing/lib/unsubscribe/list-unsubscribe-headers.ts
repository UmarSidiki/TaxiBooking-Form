/**
 * Gmail/Yahoo bulk-sender headers. The API URL supports a body-less one-click
 * POST; the page URL is the human fallback used inside the message body.
 */
export type ListUnsubscribeInput = {
  baseUrl: string;
  token: string;
  locale: string;
};

function trimBase(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}

export function unsubscribePageUrl(input: ListUnsubscribeInput): string {
  const base = trimBase(input.baseUrl);
  return `${base}/${input.locale}/u/${encodeURIComponent(input.token)}`;
}

export function unsubscribeApiUrl(input: ListUnsubscribeInput): string {
  const base = trimBase(input.baseUrl);
  return `${base}/api/marketing/unsubscribe?token=${encodeURIComponent(input.token)}`;
}

export function buildListUnsubscribeHeaders(
  input: ListUnsubscribeInput,
): Record<string, string> {
  return {
    "List-Unsubscribe": `<${unsubscribeApiUrl(input)}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}
