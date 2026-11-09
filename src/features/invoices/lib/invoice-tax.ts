import type { ISetting } from "@/features/settings/model";

export type InvoiceTax = {
  taxRate: number;
  taxInclusive: boolean;
};

/**
 * An invoice must show the tax that priced the booking, so it reads the same
 * settings the fare engine uses. The old invoice-only fields (`taxRate`,
 * `taxInclusive`) defaulted to 0/false and shadowed these through `??`.
 */
export function invoiceTaxFromSettings(
  settings?: Partial<Pick<ISetting, "enableTax" | "taxPercentage" | "taxIncluded">> | null
): InvoiceTax {
  return {
    taxRate: settings?.enableTax ? settings.taxPercentage ?? 0 : 0,
    taxInclusive: settings?.taxIncluded ?? false,
  };
}
