"use client";

import { Input } from "@/shared/ui/input";
import { Switch } from "@/shared/ui/switch";
import type { ISetting } from "@/features/settings/model";
import type { SettingsDeskPatch } from "@/features/settings/ui/settings-desk-props";
import { useTranslations } from "next-intl";

export function InvoiceLegalCard({
  settings,
  patch,
}: {
  settings: Partial<ISetting>;
  patch: SettingsDeskPatch;
}) {
  const t = useTranslations();
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="invoice-legal-name" className="mb-1 block text-sm font-medium">{t("Dashboard.Settings.legal-name")}</label>
          <Input id="invoice-legal-name" className="h-11 text-base" value={settings.legalName ?? ""} onChange={(e) => patch("legalName", e.target.value)} />
        </div>
        <div>
          <label htmlFor="invoice-address" className="mb-1 block text-sm font-medium">{t("Dashboard.Settings.invoice-address")}</label>
          <Input id="invoice-address" className="h-11 text-base" value={settings.address ?? ""} onChange={(e) => patch("address", e.target.value)} />
        </div>
        <div>
          <label htmlFor="invoice-tax-id" className="mb-1 block text-sm font-medium">{t("Dashboard.Settings.tax-id")}</label>
          <Input id="invoice-tax-id" className="h-11 text-base" value={settings.taxId ?? ""} onChange={(e) => patch("taxId", e.target.value)} />
        </div>
        <div>
          <label htmlFor="invoice-reg-no" className="mb-1 block text-sm font-medium">{t("Dashboard.Settings.reg-no")}</label>
          <Input id="invoice-reg-no" className="h-11 text-base" value={settings.regNo ?? ""} onChange={(e) => patch("regNo", e.target.value)} />
        </div>
        <div>
          <label htmlFor="invoice-tax-rate" className="mb-1 block text-sm font-medium">{t("Dashboard.Settings.tax-rate")}</label>
          <Input id="invoice-tax-rate" className="h-11 text-base" type="number" value={settings.taxRate ?? 0} onChange={(e) => patch("taxRate", Number(e.target.value) || 0)} />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Switch id="invoice-tax-inclusive" checked={settings.taxInclusive ?? false} onCheckedChange={(v) => patch("taxInclusive", v)} />
        <label htmlFor="invoice-tax-inclusive" className="text-sm">{t("Dashboard.Settings.tax-inclusive")}</label>
      </div>
      <div>
        <label htmlFor="invoice-invoice-footer" className="mb-1 block text-sm font-medium">{t("Dashboard.Settings.invoice-footer")}</label>
        <Input id="invoice-invoice-footer" className="h-11 text-base" value={settings.invoiceFooter ?? ""} onChange={(e) => patch("invoiceFooter", e.target.value)} />
      </div>
      <div>
        <label htmlFor="invoice-invoice-terms" className="mb-1 block text-sm font-medium">{t("Dashboard.Settings.invoice-terms")}</label>
        <Input id="invoice-invoice-terms" className="h-11 text-base" value={settings.invoiceTerms ?? ""} onChange={(e) => patch("invoiceTerms", e.target.value)} />
      </div>
    </div>
  );
}