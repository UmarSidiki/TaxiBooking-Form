export const API_ERROR_CODES = [
  "invalid_body",
  "unauthorized",
  "forbidden",
  "not_found",
  "conflict",
  "internal_error",
  "request_failed",
  "smtp_not_configured",
  "smtp_failed",
  "payment_init_failed",
  "payment_failed",
  "payment_not_configured",
  "price_changed",
  "distance_failed",
  "country_blocked",
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

export function isApiErrorCode(code: string): code is ApiErrorCode {
  return (API_ERROR_CODES as readonly string[]).includes(code);
}

export function apiErrorMessage(
  t: (key: ApiErrorCode) => string,
  code: string
) {
  return t(isApiErrorCode(code) ? code : "request_failed");
}
