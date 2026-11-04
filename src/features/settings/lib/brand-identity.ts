import { brandName } from "@/features/settings/lib/brand-name";
import type { ISetting } from "@/features/settings/model";

export type BrandIdentity = { name: string; logoUrl: string; initial: string };

/** The operator's name and logo, used by every surface that shows the brand. */
export function brandIdentity(
  settings: Pick<Partial<ISetting>, "companyName" | "smtpSenderName" | "companyLogoUrl"> | null | undefined,
  fallbackName = "",
): BrandIdentity {
  const name = brandName(settings) || fallbackName;
  return {
    name,
    logoUrl: settings?.companyLogoUrl?.trim() ?? "",
    initial: name.trim().charAt(0).toUpperCase(),
  };
}
