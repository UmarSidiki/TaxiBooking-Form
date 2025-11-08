import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Mail } from "lucide-react";
import { ISetting } from "@/models/settings";
import { apiPost } from "@/utils/api";
import { useTranslations } from "next-intl";

interface SmtpTabProps {
  settings: Partial<ISetting>;
  setSettings: React.Dispatch<React.SetStateAction<Partial<ISetting>>>;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const SmtpTab: React.FC<SmtpTabProps> = ({
  settings,
  setSettings,
  isLoading,
  setIsLoading,
}) => {
  const t = useTranslations();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("Dashboard.Settings.smtp-configuration")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sender Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">
            {t("Dashboard.Settings.sender-information")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t("Dashboard.Settings.from-email-address")}{" "}
              </label>
              <Input
                type="email"
                placeholder="noreply@yourdomain.com"
                value={settings.smtpFrom ?? ""}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    smtpFrom: e.target.value,
                  }))
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                {t("Dashboard.Settings.email-address-used-as-sender-for-outgoing-emails")}{" "}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                {t("Dashboard.Settings.sender-name")}{" "}
              </label>
              <Input
                type="text"
                placeholder="Your Company Name"
                value={settings.smtpSenderName ?? ""}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    smtpSenderName: e.target.value,
                  }))
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                {t("Dashboard.Settings.name-displayed-as-sender-in-emails")}{" "}
              </p>
            </div>
          </div>
        </div>

        {/* Server Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">
            {t("Dashboard.Settings.smtp-server-settings")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t("Dashboard.Settings.smtp-host")}{" "}
              </label>
              <Input
                type="text"
                placeholder="smtp.gmail.com"
                value={settings.smtpHost ?? ""}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    smtpHost: e.target.value,
                  }))
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                {t("Dashboard.Settings.your-smtp-server-hostname")}{" "}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                {t("Dashboard.Settings.smtp-port")}{" "}
              </label>
              <Input
                type="number"
                placeholder="587"
                value={settings.smtpPort ?? 587}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    smtpPort: parseInt(e.target.value) || 587,
                  }))
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                {t("Dashboard.Settings.common-ports-587-tls-465-ssl-25-none")}{" "}
              </p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              {t("Dashboard.Settings.encryption")}{" "}
            </label>
            <select
              value={settings.smtpEncryption ?? "TLS"}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  smtpEncryption: e.target.value as "TLS" | "SSL" | "none",
                }))
              }
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="TLS">
                {t("Dashboard.Settings.tls-recommended")}
              </option>
              <option value="SSL">SSL</option>
              <option value="none">{t("Dashboard.Settings.none")}</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {t("Dashboard.Settings.security-protocol-for-smtp-connection")}{" "}
            </p>
          </div>
        </div>

        {/* Authentication */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">
            {t("Dashboard.Settings.authentication")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t("Dashboard.Settings.username")}{" "}
              </label>
              <Input
                type="text"
                placeholder="your-email@gmail.com"
                value={settings.smtpUser ?? ""}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    smtpUser: e.target.value,
                  }))
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                {t("Dashboard.Settings.your-smtp-username-email")}{" "}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                {t("Dashboard.Settings.password")}{" "}
              </label>
              <Input
                type="password"
                placeholder="your-app-password"
                value={settings.smtpPass ?? ""}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    smtpPass: e.target.value,
                  }))
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                {t("Dashboard.Settings.your-smtp-password-or-app-password")}{" "}
              </p>
            </div>
          </div>
        </div>

        {/* Testing */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">
            {t("Dashboard.Settings.testing")}
          </h3>
          <div>
            <label className="block text-sm font-medium mb-2">
              {t("Dashboard.Settings.test-email-recipient")}{" "}
            </label>
            <Input
              type="email"
              placeholder="test@example.com"
              value={settings.smtpTestEmail ?? ""}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  smtpTestEmail: e.target.value,
                }))
              }
            />
            <p className="text-xs text-gray-500 mt-1">
              {t(
                "Dashboard.Settings.email-address-to-send-test-emails-to-leave-empty-to-send-to-smtp-user"
              )}{" "}
            </p>
          </div>
        </div>

        {/* Test SMTP */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="text-lg font-medium">
            {t("Dashboard.Settings.test-smtp-configuration")}
          </h3>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Button
              onClick={async () => {
                setIsLoading(true);
                try {
                  const response = await apiPost<{
                    success: boolean;
                    message: string;
                  }>("/api/test-smtp", {});
                  if (response.success) {
                    alert(
                      "SMTP test successful! Check your inbox for the test email."
                    );
                  } else {
                    alert(`SMTP test failed: ${response.message}`);
                  }
                } catch (error) {
                  console.error("Error testing SMTP:", error);
                  alert("Error testing SMTP configuration");
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={isLoading || !settings.smtpHost || !settings.smtpUser}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  {t("Dashboard.Settings.test-smtp")}{" "}
                </>
              )}
            </Button>
            <p className="text-sm text-gray-600">
              {t(
                "Dashboard.Settings.send-a-test-email-to-verify-your-smtp-configuration"
              )}{" "}
            </p>
          </div>
        </div>

        {/* Info Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong>{" "}
            {t(
              "Dashboard.Settings.smtp-settings-are-used-for-sending-booking-confirmation-emails-make-sure-your-smtp-provider-allows-less-secure-apps-or-use-app-passwords-if-required"
            )}{" "}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SmtpTab;
