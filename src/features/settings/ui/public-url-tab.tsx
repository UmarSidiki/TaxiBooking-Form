"use client";

import { useTranslations } from "next-intl";

import type { ISetting } from "@/features/settings/model";
import { Input } from "@/shared/ui/input";

export function PublicUrlTab({
  settings,
  detected,
  onChange,
}: {
  settings: Partial<ISetting>;
  detected: string | null;
  onChange: (value: string) => void;
}) {
  const t = useTranslations();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm font-medium">
          {t("Dashboard.Settings.public-url-detected")}
        </p>
        <p className="break-all font-mono text-sm text-muted-foreground">
          {detected || t("Dashboard.Settings.public-url-not-detected")}
        </p>
      </div>
      <div className="space-y-2">
        <label htmlFor="public-base-url" className="block text-sm font-medium">
          {t("Dashboard.Settings.public-url-override")}
        </label>
        <Input
          id="public-base-url"
          name="publicBaseUrl"
          inputMode="url"
          placeholder="https://example.com"
          className="h-11"
          value={settings.publicBaseUrl ?? ""}
          onChange={(event) => onChange(event.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          {t("Dashboard.Settings.public-url-override-help")}
        </p>
      </div>
    </div>
  );
}
