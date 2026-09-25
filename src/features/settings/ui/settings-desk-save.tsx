"use client";

import { useEffect } from "react";
import { Loader2, Save } from "lucide-react";
import { useTranslations } from "next-intl";

import { DeskPageMeta } from "@/features/dashboard/ui/desk-page-chrome";
import { DeskNotice } from "@/features/dashboard/ui/desk-notice";
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
      <DeskPageMeta title={title} description={help} />
      <div className="flex justify-end">
        <Button type="button" onClick={save} disabled={isLoading} className="h-10 rounded-xl px-4 font-semibold">
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
        <DeskNotice>{notice}</DeskNotice>
      ) : null}
    </div>
  );
}
