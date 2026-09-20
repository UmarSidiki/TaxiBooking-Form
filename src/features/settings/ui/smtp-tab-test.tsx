"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Loader2, Mail } from "lucide-react";
import { apiPost } from "@/shared/http/api";
import { apiErrorCode } from "@/shared/http/api-error-code";
import { apiErrorMessage } from "@/shared/lib/api-error-copy";
import type { SmtpTabProps } from "@/features/settings/ui/smtp-tab-props";
import type { useTranslations } from "next-intl";

type Props = SmtpTabProps & {
  t: ReturnType<typeof useTranslations>;
};

export function SmtpTabTest({
  settings,
  setSettings,
  isLoading,
  setIsLoading,
  t,
}: Props) {
  const [notice, setNotice] = useState<string | null>(null);

  const runTest = async () => {
    setIsLoading(true);
    try {
      const response = await apiPost<{ success: boolean; message: string }>(
        "/api/test-smtp",
        {}
      );
      setNotice(
        response.success
          ? t("Dashboard.Settings.smtp_test_ok")
          : t("Dashboard.Settings.smtp_test_failed")
      );
    } catch (error) {
      setNotice(
        apiErrorMessage(
          (key) => t(`ApiErrors.${key}`),
          apiErrorCode(error)
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 border-t pt-4">
      <h3 className="text-lg font-medium">{t("Dashboard.Settings.testing")}</h3>
      <div>
        <label className="mb-2 block text-sm font-medium">
          {t("Dashboard.Settings.test-email-recipient")}
        </label>
        <Input
          type="email"
          value={settings.smtpTestEmail ?? ""}
          onChange={(e) =>
            setSettings((prev) => ({ ...prev, smtpTestEmail: e.target.value }))
          }
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {t(
            "Dashboard.Settings.email-address-to-send-test-emails-to-leave-empty-to-send-to-smtp-user"
          )}
        </p>
      </div>
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <Button
          type="button"
          onClick={runTest}
          disabled={isLoading || !settings.smtpHost || !settings.smtpUser}
          className="min-h-11"
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Mail className="size-4" />
          )}
          {isLoading
            ? t("Dashboard.Settings.smtp_testing")
            : t("Dashboard.Settings.test-smtp")}
        </Button>
        <p className="text-sm text-muted-foreground">
          {t(
            "Dashboard.Settings.send-a-test-email-to-verify-your-smtp-configuration"
          )}
        </p>
      </div>
      {notice ? (
        <p className="rounded-md border border-border bg-card px-4 py-3 text-sm" role="status">
          {notice}
        </p>
      ) : null}
    </div>
  );
}
