"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { useSettingsDesk } from "@/features/settings/ui/settings-desk-context";
import { SettingsDeskNav } from "@/features/settings/ui/settings-desk-nav";
import { Button } from "@/shared/ui/button";

export function SettingsDeskShell({ children }: { children: ReactNode }) {
  const t = useTranslations();
  const { isFetching, loadError, refetch } = useSettingsDesk();

  if (isFetching) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        <Loader2 className="me-2 size-5 animate-spin" />
        {t("Dashboard.Settings.loading")}
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-start gap-4 py-12">
        <p className="text-sm text-destructive" role="alert">
          {t("Dashboard.Settings.failed-to-load-settings")}
        </p>
        <Button type="button" className="h-11" onClick={() => void refetch()}>
          {t("Dashboard.Settings.retry")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <SettingsDeskNav />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
