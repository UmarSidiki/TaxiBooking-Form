import { Setting } from "@/features/settings/model";

export type PartnerCashSettlement = "keep_cash" | "operator_margin";
export type DispatchAssigneeMode = "exclusive" | "allow_both";

export type PartnerDispatchSettings = {
  enablePartners: boolean;
  partnerCashSettlement: PartnerCashSettlement;
  dispatchAssigneeMode: DispatchAssigneeMode;
  defaultPartnerMarginPercentage: number;
  currency: string;
};

/** Short enough that an operator save shows up on the next warm invocation. */
const CACHE_TTL_MS = 15_000;

let cached: { at: number; value: PartnerDispatchSettings } | null = null;

export function clearPartnerDispatchSettingsCache() {
  cached = null;
}

export async function getPartnerDispatchSettings() {
  const now = Date.now();
  if (cached && now - cached.at < CACHE_TTL_MS) {
    return cached.value;
  }

  const settings = await Setting.findOne()
    .select(
      "enablePartners partnerCashSettlement dispatchAssigneeMode defaultPartnerMarginPercentage stripeCurrency"
    )
    .lean();

  const value: PartnerDispatchSettings = {
    enablePartners: Boolean(settings?.enablePartners),
    partnerCashSettlement: (settings?.partnerCashSettlement ??
      "keep_cash") as PartnerCashSettlement,
    dispatchAssigneeMode: (settings?.dispatchAssigneeMode ??
      "exclusive") as DispatchAssigneeMode,
    defaultPartnerMarginPercentage:
      typeof settings?.defaultPartnerMarginPercentage === "number"
        ? settings.defaultPartnerMarginPercentage
        : 20,
    currency: settings?.stripeCurrency ?? "eur",
  };

  cached = { at: now, value };
  return value;
}
