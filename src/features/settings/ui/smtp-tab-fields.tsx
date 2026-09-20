"use client";

import { Input } from "@/shared/ui/input";
import { DeskSelect } from "@/features/dashboard/ui/desk-select";
import type { SmtpTabProps } from "@/features/settings/ui/smtp-tab-props";
import type { useTranslations } from "next-intl";

type Props = Pick<SmtpTabProps, "settings" | "setSettings"> & {
  t: ReturnType<typeof useTranslations>;
};

export function SmtpTabFields({ settings, setSettings, t }: Props) {
  return (
    <>
      <div className="space-y-4">
        <h3 className="text-lg font-medium">
          {t("Dashboard.Settings.sender-information")}
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">
              {t("Dashboard.Settings.from-email-address")}
            </label>
            <Input
              type="email"
              value={settings.smtpFrom ?? ""}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, smtpFrom: e.target.value }))
              }
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {t(
                "Dashboard.Settings.email-address-used-as-sender-for-outgoing-emails"
              )}
            </p>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">
              {t("Dashboard.Settings.sender-name")}
            </label>
            <Input
              type="text"
              value={settings.smtpSenderName ?? ""}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  smtpSenderName: e.target.value,
                }))
              }
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {t("Dashboard.Settings.name-displayed-as-sender-in-emails")}
            </p>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <h3 className="text-lg font-medium">
          {t("Dashboard.Settings.smtp-server-settings")}
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">
              {t("Dashboard.Settings.smtp-host")}
            </label>
            <Input
              type="text"
              value={settings.smtpHost ?? ""}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, smtpHost: e.target.value }))
              }
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {t("Dashboard.Settings.your-smtp-server-hostname")}
            </p>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">
              {t("Dashboard.Settings.smtp-port")}
            </label>
            <Input
              type="number"
              value={settings.smtpPort ?? 587}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  smtpPort: parseInt(e.target.value, 10) || 587,
                }))
              }
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {t("Dashboard.Settings.common-ports-587-tls-465-ssl-25-none")}
            </p>
          </div>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">
            {t("Dashboard.Settings.encryption")}
          </label>
          <DeskSelect
            ariaLabel={t("Dashboard.Settings.encryption")}
            value={settings.smtpEncryption ?? "TLS"}
            onValueChange={(value) =>
              setSettings((prev) => ({
                ...prev,
                smtpEncryption: value as "TLS" | "SSL" | "none",
              }))
            }
            options={[
              { value: "TLS", label: t("Dashboard.Settings.tls-recommended") },
              { value: "SSL", label: t("Dashboard.Settings.ssl") },
              { value: "none", label: t("Dashboard.Settings.none") },
            ]}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {t("Dashboard.Settings.security-protocol-for-smtp-connection")}
          </p>
        </div>
      </div>
      <div className="space-y-4">
        <h3 className="text-lg font-medium">
          {t("Dashboard.Settings.authentication")}
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">
              {t("Dashboard.Settings.username")}
            </label>
            <Input
              type="text"
              value={settings.smtpUser ?? ""}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, smtpUser: e.target.value }))
              }
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {t("Dashboard.Settings.your-smtp-username-email")}
            </p>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">
              {t("Dashboard.Settings.password")}
            </label>
            <Input
              type="password"
              value={settings.smtpPass ?? ""}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, smtpPass: e.target.value }))
              }
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {t("Dashboard.Settings.your-smtp-password-or-app-password")}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
