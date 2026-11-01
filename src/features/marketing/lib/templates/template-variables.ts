import type { TemplateVariable } from "@/features/marketing/schema/campaign-template.schema";

export type TemplateVariableValues = Record<TemplateVariable, string>;

export type TemplateCustomer = {
  name: string;
  lastRideAt: Date | null;
  rideCount: number;
  locale?: string;
};

const EMPTY_VALUES: TemplateVariableValues = {
  firstName: "",
  lastRideDate: "",
  rideCount: "",
  bookingUrl: "",
  promoCode: "",
  unsubscribeUrl: "",
};

function firstNameOf(name: string): string {
  return name.trim().split(/\s+/)[0] ?? "";
}

function formatRideDate(date: Date | null, locale: string): string {
  if (!date) return "";
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(date);
}

export function buildTemplateVariables(input: {
  customer?: TemplateCustomer | null;
  locale: string;
  bookingUrl?: string | null;
  promoCode?: string | null;
  unsubscribeUrl?: string | null;
}): TemplateVariableValues {
  const customer = input.customer ?? null;
  return {
    ...EMPTY_VALUES,
    firstName: customer ? firstNameOf(customer.name) : "",
    lastRideDate: customer
      ? formatRideDate(customer.lastRideAt, input.locale)
      : "",
    rideCount: customer ? String(customer.rideCount) : "",
    bookingUrl: (input.bookingUrl ?? "").trim(),
    promoCode: (input.promoCode ?? "").trim(),
    unsubscribeUrl: (input.unsubscribeUrl ?? "").trim(),
  };
}

/** Variables a customer cannot supply yet; surfaced in the preview warnings. */
export function missingTemplateVariables(
  used: string[],
  values: TemplateVariableValues,
): string[] {
  return used.filter((name) => {
    if (!(name in values)) return true;
    return values[name as TemplateVariable].trim() === "";
  });
}
