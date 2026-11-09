"use client";

import { Input } from "@/shared/ui/input";
import { useTranslations } from "next-intl";
import { useCallback, useRef, useState } from "react";

import { SettingsSection } from "@/features/settings/ui/settings-section";
import type { ISetting } from "@/features/settings/model";
import type { SettingsDeskPatch } from "@/features/settings/ui/settings-desk-props";

/**
 * Brand identity (company name, logo, public contact) for Settings → Appearance.
 * The database is the single source of truth — see brand-name.ts. These fields
 * feed the site title, the account pills, emails, invoices and favicon.
 */
export default function BrandIdentityTab({
  settings,
  patch,
}: {
  settings: Partial<ISetting>;
  patch: SettingsDeskPatch;
}) {
  const t = useTranslations();
  const fileRef = useRef<HTMLInputElement>(null);
  const [logoError, setLogoError] = useState<string | null>(null);

  const name = settings.companyName ?? "";
  const logoUrl = settings.companyLogoUrl ?? "";
  const phone = settings.companyPhone ?? "";
  const email = settings.adminEmail ?? "";

  const pickLogo = useCallback(
    (file: FileList | null) => {
      const f = file?.[0];
      if (!f) return;
      setLogoError(null);
      if (f.size > 400_000) {
        setLogoError(t("Dashboard.Settings.company-logo-too-large"));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        patch("companyLogoUrl", String(reader.result ?? ""));
      };
      reader.readAsDataURL(f);
    },
    [patch, t],
  );

  return (
    <SettingsSection title={t("Dashboard.Settings.brand-identity")}>
      <div className="grid gap-4">
        <div>
          <label htmlFor="brand-company-name" className="mb-2 block text-sm font-medium">
            {t("Dashboard.Settings.company-name")}
          </label>
          <Input
            id="brand-company-name"
            name="brand-company-name"
            type="text"
            autoComplete="organization"
            value={name}
            onChange={(e) => patch("companyName", e.target.value)}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {t("Dashboard.Settings.company-name-help")}
          </p>
        </div>

        <div>
          <label htmlFor="brand-company-logo" className="mb-2 block text-sm font-medium">
            {t("Dashboard.Settings.company-logo")}
          </label>
          <Input
            id="brand-company-logo"
            name="brand-company-logo"
            type="url"
            inputMode="url"
            placeholder="https://…/logo.png"
            value={logoUrl.startsWith("data:") ? "" : logoUrl}
            onChange={(e) => patch("companyLogoUrl", e.target.value)}
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
            className="hidden"
            onChange={(e) => pickLogo(e.target.files)}
          />
          <div className="mt-2 flex items-center gap-3">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={name || t("Dashboard.Settings.company-logo")}
                className="h-10 w-auto max-w-40 rounded-md border border-border object-contain"
                onError={() => setLogoError(t("Dashboard.Settings.company-logo-broken"))}
              />
            ) : null}
            <button
              type="button"
              className="text-sm underline underline-offset-4 hover:text-primary"
              onClick={() => fileRef.current?.click()}
            >
              {t("Dashboard.Settings.company-logo-upload")}
            </button>
            {logoUrl ? (
              <button
                type="button"
                className="text-sm underline underline-offset-4 hover:text-primary"
                onClick={() => patch("companyLogoUrl", "")}
              >
                {t("Dashboard.Settings.company-logo-remove")}
              </button>
            ) : null}
          </div>
          {logoError ? (
            <p role="alert" className="mt-1 text-xs text-destructive">
              {logoError}
            </p>
          ) : null}
          <p className="mt-1 text-xs text-muted-foreground">
            {t("Dashboard.Settings.company-logo-help")}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="brand-company-phone" className="mb-2 block text-sm font-medium">
              {t("Dashboard.Settings.company-phone")}
            </label>
            <Input
              id="brand-company-phone"
              name="brand-company-phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => patch("companyPhone", e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="brand-support-email" className="mb-2 block text-sm font-medium">
              {t("Dashboard.Settings.support-email")}
            </label>
            <Input
              id="brand-support-email"
              name="brand-support-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => patch("adminEmail", e.target.value)}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {t("Dashboard.Settings.support-email-help")}
            </p>
          </div>
        </div>
      </div>
    </SettingsSection>
  );
}
