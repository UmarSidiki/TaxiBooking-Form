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
          <label className="mb-1 block text-sm font-medium">{t("Dashboard.Settings.legal-name")}</label>
          <Input className="h-11 text-base" value={settings.legalName ?? ""} onChange={(e) => patch("legalName", e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">{t("Dashboard.Settings.invoice-address")}</label>
          <Input className="h-11 text-base" value={settings.address ?? ""} onChange={(e) => patch("address", e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">{t("Dashboard.Settings.tax-id")}</label>
          <Input className="h-11 text-base" value={settings.taxId ?? ""} onChange={(e) => patch("taxId", e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">{t("Dashboard.Settings.reg-no")}</label>
          <Input className="h-11 text-base" value={settings.regNo ?? ""} onChange={(e) => patch("regNo", e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">{t("Dashboard.Settings.tax-rate")}</label>
          <Input className="h-11 text-base" type="number" value={settings.taxRate ?? 0} onChange={(e) => patch("taxRate", Number(e.target.value) || 0)} />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Switch checked={settings.taxInclusive ?? false} onCheckedChange={(v) => patch("taxInclusive", v)} />
        <span className="text-sm">{t("Dashboard.Settings.tax-inclusive")}</span>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">{t("Dashboard.Settings.invoice-footer")}</label>
        <Input className="h-11 text-base" value={settings.invoiceFooter ?? ""} onChange={(e) => patch("invoiceFooter", e.target.value)} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">{t("Dashboard.Settings.invoice-terms")}</label>
        <Input className="h-11 text-base" value={settings.invoiceTerms ?? ""} onChange={(e) => patch("invoiceTerms", e.target.value)} />
      </div>
    </div>
  );
}