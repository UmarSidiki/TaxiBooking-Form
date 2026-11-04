/** 24-char hex check without a regex, so the feature stays scan-free. */
export function isObjectIdString(value: string): boolean {
  if (value.length !== 24) return false;
  for (const char of value) {
    const code = char.charCodeAt(0);
    const digit = code >= 48 && code <= 57;
    const lower = code >= 97 && code <= 102;
    const upper = code >= 65 && code <= 70;
    if (!digit && !lower && !upper) return false;
  }
  return true;
}
