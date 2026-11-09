import { describe, expect, it } from "vitest";
import { invoiceTaxFromSettings } from "@/features/invoices/lib/invoice-tax";

describe("invoice tax", () => {
  it("follows the settings that priced the booking", () => {
    expect(
      invoiceTaxFromSettings({ enableTax: true, taxPercentage: 10, taxIncluded: true })
    ).toEqual({ taxRate: 10, taxInclusive: true });

    expect(
      invoiceTaxFromSettings({ enableTax: true, taxPercentage: 7.7, taxIncluded: false })
    ).toEqual({ taxRate: 7.7, taxInclusive: false });
  });

  it("prints no tax rate when the tax module is off", () => {
    expect(
      invoiceTaxFromSettings({ enableTax: false, taxPercentage: 10, taxIncluded: true })
    ).toEqual({ taxRate: 0, taxInclusive: true });
  });

  it("falls back to no tax when settings are absent", () => {
    expect(invoiceTaxFromSettings(null)).toEqual({ taxRate: 0, taxInclusive: false });
  });
});
