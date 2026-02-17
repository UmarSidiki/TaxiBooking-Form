import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ISetting } from "@/models/settings";
import { useTranslations } from "next-intl";

interface BookingTabProps {
  settings: Partial<ISetting>;
  handleMapSettingsChange: (
    key: keyof ISetting,
    value: string | number | string[] | boolean
  ) => void;
}

const BookingTab: React.FC<BookingTabProps> = ({
  settings,
  handleMapSettingsChange,
}) => {
  const t = useTranslations();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("Dashboard.Settings.booking-settings")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Redirect URL Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">
            {t("Dashboard.Settings.post-booking-redirect")}
          </h3>
          <div>
            <label className="block text-sm font-medium mb-2">
              {t("Dashboard.Settings.redirect-url")}
            </label>
            <Input
              type="url"
              placeholder={t(
                "Dashboard.Settings.https-yourwebsite-com-or-leave-empty-for-home-page"
              )}
              value={settings.redirectUrl || ""}
              onChange={(e) =>
                handleMapSettingsChange("redirectUrl", e.target.value)
              }
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-2">
              {t(
                "Dashboard.Settings.after-a-successful-booking-customers-will-be-redirected-to-this-url-after-3-seconds"
              )}{" "}
              <br />
              {t(
                "Dashboard.Settings.leave-empty-to-redirect-to-the-home-page"
              )}{" "}
            </p>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("Dashboard.Settings.thank-you-stay-time")}
                </label>
                <Input
                  type="number"
                  min={0}
                  className="w-32"
                  value={settings.thankYouStaySeconds ?? 5}
                  onChange={(e) =>
                    handleMapSettingsChange("thankYouStaySeconds", Number(e.target.value || 0))
                  }
                />
                <p className="text-xs text-gray-500 mt-2">
                  {t("Dashboard.Settings.thank-you-stay-time-help")}
                </p>
              </div>

              <div className="flex items-start gap-4">
                <Switch
                  id="redirectImmediatelyAfterBooking"
                  checked={settings.redirectImmediatelyAfterBooking ?? false}
                  onCheckedChange={(val: boolean) =>
                    handleMapSettingsChange("redirectImmediatelyAfterBooking", val)
                  }
                />
                <div>
                  <label className="block text-sm font-medium">
                    {t("Dashboard.Settings.redirect-immediately-after-booking")}
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    {t("Dashboard.Settings.redirect-immediately-after-booking-help")}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-800">
                <strong>{t("Dashboard.Settings.tip")}</strong>{" "}
                {t("Dashboard.Settings.you-can-redirect-to")}
                <br />
                {t("Dashboard.Settings.your-main-website-homepage")}
                <br />
                {t(
                  "Dashboard.Settings.a-custom-thank-you-page-on-your-site"
                )}
                <br />
                {t("Dashboard.Settings.a-special-offers-page")}
                <br />
                {t("Dashboard.Settings.or-any-other-url-you-choose")}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BookingTab;