import { Input } from "@/shared/ui/input";
import { Switch } from "@/shared/ui/switch";
import { ISetting } from "@/features/settings/model";
import { useTranslations } from "next-intl";

interface BookingTabProps {
  settings: Partial<ISetting>;
  handleMapSettingsChange: (
    key: keyof ISetting,
    value: string | number | string[] | boolean
  ) => void;
}

export default function BookingTab({
  settings,
  handleMapSettingsChange,
}: BookingTabProps) {
  const t = useTranslations();

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium">
        {t("Dashboard.Settings.redirect-url")}
      </label>
      <Input
        type="url"
        className="h-11"
        placeholder={t(
          "Dashboard.Settings.https-yourwebsite-com-or-leave-empty-for-home-page"
        )}
        value={settings.redirectUrl || ""}
        onChange={(e) => handleMapSettingsChange("redirectUrl", e.target.value)}
      />
      <p className="text-xs text-muted-foreground">
        {t("Dashboard.Settings.after-a-successful-booking-customers-will-be-redirected-to-this-url-after-3-seconds")}{" "}
        {t("Dashboard.Settings.leave-empty-to-redirect-to-the-home-page")}
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium">
            {t("Dashboard.Settings.thank-you-stay-time")}
          </label>
          <Input
            type="number"
            min={0}
            className="h-11 w-32"
            value={settings.thankYouStaySeconds ?? 5}
            onChange={(e) =>
              handleMapSettingsChange("thankYouStaySeconds", Number(e.target.value || 0))
            }
          />
          <p className="mt-2 text-xs text-muted-foreground">
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
            <label htmlFor="redirectImmediatelyAfterBooking" className="text-sm font-medium">
              {t("Dashboard.Settings.redirect-immediately-after-booking")}
            </label>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("Dashboard.Settings.redirect-immediately-after-booking-help")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
