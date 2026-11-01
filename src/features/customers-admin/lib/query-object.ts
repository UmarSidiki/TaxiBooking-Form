/** Drops empty query values so Zod defaults apply instead of failing coercion. */
export function queryObjectFromSearchParams(
  searchParams: URLSearchParams,
): Record<string, string> {
  const query: Record<string, string> = {};
  for (const [key, value] of searchParams) {
    if (value !== "") query[key] = value;
  }
  return query;
}
