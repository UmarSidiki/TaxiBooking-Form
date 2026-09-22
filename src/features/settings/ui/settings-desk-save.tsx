"use client";

import { useEffect } from "react";
import { Loader2, Save } from "lucide-react";
import { useTranslations } from "next-intl";

import { useSettingsDesk } from "@/features/settings/ui/settings-desk-context";
import { Button } from "@/shared/ui/button";

export function SettingsDeskSave({
  title,
  help,
}: {
  title: string;
  help?: string;
}) {
  const t = useTranslations();
  const { save, isLoading, notice, dismissNotice } = useSettingsDesk();

  useEffect(() => () => dismissNotice(), [dismissNotice]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          {help ? (
            <p className="max-w-xl text-pretty text-sm text-muted-foreground">{help}</p>
          ) : null}
        </div>
        <Button type="button" onClick={save} disabled={isLoading} className="h-11">
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="size-4" aria-hidden="true" />
          )}
          {isLoading
            ? t("Dashboard.Settings.saving")
            : t("Dashboard.Settings.save")}
        </Button>
      </div>
      {notice ? (
        <p
          className="rounded-md border border-border bg-card px-4 py-3 text-sm"
          role="status"
        >
          {notice}
        </p>
      ) : null}
    </div>
  );
}
