"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { SmtpTabFields } from "@/features/settings/ui/smtp-tab-fields";
import { SmtpTabTest } from "@/features/settings/ui/smtp-tab-test";
import type { SmtpTabProps } from "@/features/settings/ui/smtp-tab-props";
import { useTranslations } from "next-intl";

export default function SmtpTab(props: SmtpTabProps) {
  const t = useTranslations();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("Dashboard.Settings.smtp-configuration")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <SmtpTabFields
          settings={props.settings}
          setSettings={props.setSettings}
          t={t}
        />
        <SmtpTabTest {...props} t={t} />
        <div className="rounded-lg border border-primary/20 bg-primary/10 p-4">
          <p className="text-sm text-foreground">
            {t(
              "Dashboard.Settings.smtp-settings-are-used-for-sending-booking-confirmation-emails-make-sure-your-smtp-provider-allows-less-secure-apps-or-use-app-passwords-if-required"
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
