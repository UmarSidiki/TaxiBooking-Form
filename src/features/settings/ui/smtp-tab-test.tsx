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

type Props = {
  settings: SmtpTabProps["settings"];
  setSettings: SmtpTabProps["setSettings"];
  t: ReturnType<typeof useTranslations>;
};

export function SmtpTabTest({
  settings,
  setSettings,
  t,
}: Props) {
  const [notice, setNotice] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const runTest = async () => {
    setTesting(true);
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
      setTesting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label htmlFor="smtp-test-recipient" className="mb-2 block text-sm font-medium">
          {t("Dashboard.Settings.test-email-recipient")}
        </label>
        <Input
          id="smtp-test-recipient"
          name="smtp-test-recipient"
          type="email"
          autoComplete="email"
          spellCheck={false}
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
          disabled={testing || !settings.smtpHost || !settings.smtpUser}
          className="min-h-11"
        >
          {testing ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Mail className="size-4" aria-hidden="true" />
          )}
          {testing
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
