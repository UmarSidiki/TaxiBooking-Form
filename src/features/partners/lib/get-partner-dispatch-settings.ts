import { Setting } from "@/features/settings/model";

export type PartnerCashSettlement = "keep_cash" | "operator_margin";
export type DispatchAssigneeMode = "exclusive" | "allow_both";

export async function getPartnerDispatchSettings() {
  const settings = await Setting.findOne().lean();
  return {
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
}
