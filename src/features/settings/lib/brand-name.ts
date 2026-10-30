import type { ISetting } from "@/features/settings/model";

/** Operator brand: company name, then SMTP sender name, then the env site name. Empty when none is set. */
export function brandName(settings?: Pick<Partial<ISetting>, "companyName" | "smtpSenderName"> | null): string {
  return (
    settings?.companyName?.trim() ||
    settings?.smtpSenderName?.trim() ||
    process.env.NEXT_PUBLIC_WEBSITE_NAME?.trim() ||
    ""
  );
}
