export const WHATSAPP_HEADROOM_MS = 5_000;
export const WHATSAPP_DEFAULT_SEND_BUDGET_MS = 20_000;

export const WHATSAPP_OTP_MAX_DURATION_SECONDS = 30;
export const WHATSAPP_PHONE_MAX_DURATION_SECONDS = 30;
export const WHATSAPP_SETTINGS_MAX_DURATION_SECONDS = 30;
export const WHATSAPP_NOTIFICATION_MAX_DURATION_SECONDS = 30;
export const WHATSAPP_BOOKING_MAX_DURATION_SECONDS = 60;
export const WHATSAPP_CRON_MAX_DURATION_SECONDS = 60;

/** Time a route may spend sending, leaving headroom before the platform kills it. */
export function whatsappBudgetMs(maxDurationSeconds: number) {
  return Math.max(1_000, maxDurationSeconds * 1_000 - WHATSAPP_HEADROOM_MS);
}
