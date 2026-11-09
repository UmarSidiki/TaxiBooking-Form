import type { ISetting } from "@/features/settings/model";

/**
 * Single source of truth for the operator brand. The database owns the name —
 * no environment fallback: a blank operator name is an empty string, never a
 * placeholder brand.
 */
export function brandName(
  settings?: Pick<Partial<ISetting>, "companyName" | "smtpSenderName"> | null,
): string {
  return settings?.companyName?.trim() || settings?.smtpSenderName?.trim() || "";
}
