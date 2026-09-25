import type { ISetting } from "@/features/settings/model";

/**
 * Fields the browser is allowed to see. Credentials and SMTP/admin
 * configuration are deliberately absent - use ?scope=full as an admin for those.
 */
export const PUBLIC_SETTING_FIELDS = [
  "primaryColor",
  "secondaryColor",
  "borderRadius",
  "redirectUrl",
  "thankYouStaySeconds",
  "redirectImmediatelyAfterBooking",
  "mapInitialLat",
  "mapInitialLng",
  "allowedBookingCountries",
  "mapBounds",
  "mapPolygonPoints",
  "stripePublishableKey",
  "stripeCurrency",
  "acceptedPaymentMethods",
  "bankName",
  "bankAccountName",
  "bankAccountNumber",
  "bankIBAN",
  "bankSwiftBIC",
  "enablePartners",
  "enableDrivers",
  "enableAppointmentRequest",
  "enableEmbeddableForm",
  "enableFormBuilder",
  "enableDeskBooking",
  "enableTax",
  "taxPercentage",
  "taxIncluded",
  "partnerCashSettlement",
  "dispatchAssigneeMode",
  "defaultPartnerMarginPercentage",
  "timezone",
] as const;

export type PublicSettingField = (typeof PUBLIC_SETTING_FIELDS)[number];

export type PublicSettings = Pick<ISetting, PublicSettingField> & {
  /** The pay page needs to know whether MultiSafepay is configured. */
  hasMultisafepayApiKey: boolean;
};

export function toPublicSettings(
  source: Partial<ISetting> | null | undefined
): PublicSettings {
  const settings = source ?? {};
  const publicSettings = Object.fromEntries(
    PUBLIC_SETTING_FIELDS.map((field) => [field, settings[field]])
  ) as Pick<ISetting, PublicSettingField>;

  return {
    ...publicSettings,
    hasMultisafepayApiKey: Boolean(settings.multisafepayApiKey),
  };
}
