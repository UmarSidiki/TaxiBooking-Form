import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  WHATSAPP_BOOKING_MAX_DURATION_SECONDS,
  WHATSAPP_CRON_MAX_DURATION_SECONDS,
  WHATSAPP_NOTIFICATION_MAX_DURATION_SECONDS,
  WHATSAPP_OTP_MAX_DURATION_SECONDS,
  WHATSAPP_PHONE_MAX_DURATION_SECONDS,
  WHATSAPP_SETTINGS_MAX_DURATION_SECONDS,
} from "@/features/settings/lib/whatsapp-deadline";

const ROUTES: Array<{ file: string; maxDuration: number }> = [
  {
    file: "src/app/api/account/otp/route.ts",
    maxDuration: WHATSAPP_OTP_MAX_DURATION_SECONDS,
  },
  {
    file: "src/app/api/account/phone/route.ts",
    maxDuration: WHATSAPP_PHONE_MAX_DURATION_SECONDS,
  },
  {
    file: "src/app/api/account/trips/[id]/route.ts",
    maxDuration: WHATSAPP_NOTIFICATION_MAX_DURATION_SECONDS,
  },
  {
    file: "src/app/api/admin/invoices/[tripId]/route.ts",
    maxDuration: WHATSAPP_NOTIFICATION_MAX_DURATION_SECONDS,
  },
  {
    file: "src/app/api/booking/route.ts",
    maxDuration: WHATSAPP_BOOKING_MAX_DURATION_SECONDS,
  },
  {
    file: "src/app/api/cron/route.ts",
    maxDuration: WHATSAPP_CRON_MAX_DURATION_SECONDS,
  },
  {
    file: "src/app/api/drivers/rides/[id]/route.ts",
    maxDuration: WHATSAPP_NOTIFICATION_MAX_DURATION_SECONDS,
  },
  {
    file: "src/app/api/partners/rides/[id]/accept/route.ts",
    maxDuration: WHATSAPP_NOTIFICATION_MAX_DURATION_SECONDS,
  },
  {
    file: "src/app/api/settings/whatsapp/notify/route.ts",
    maxDuration: WHATSAPP_SETTINGS_MAX_DURATION_SECONDS,
  },
  {
    file: "src/app/api/settings/whatsapp/test/route.ts",
    maxDuration: WHATSAPP_SETTINGS_MAX_DURATION_SECONDS,
  },
];

function literalMaxDuration(source: string): number | null {
  const match = source.match(/^export const maxDuration = (\d+);$/m);
  return match ? Number(match[1]) : null;
}

describe("route segment config", () => {
  it.each(ROUTES)(
    "$file exports a literal maxDuration matching its constant",
    ({ file, maxDuration }) => {
      const source = readFileSync(path.join(process.cwd(), file), "utf8");
      expect(literalMaxDuration(source)).toBe(maxDuration);
    },
  );
});
