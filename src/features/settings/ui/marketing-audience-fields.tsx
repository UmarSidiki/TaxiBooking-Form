"use client";

import type { Dispatch, SetStateAction } from "react";
import type { useTranslations } from "next-intl";

import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Switch } from "@/shared/ui/switch";
import { Textarea } from "@/shared/ui/textarea";
import type { ISetting } from "@/features/settings/model";
import {
  MARKETING_QUIET_HOURS,
  WHATSAPP_MARKETING_DAILY_CAP,
} from "@/features/marketing/lib/marketing.constants";

type Props = {
  settings: Partial<ISetting>;
  setSettings: Dispatch<SetStateAction<Partial<ISetting>>>;
  t: ReturnType<typeof useTranslations>;
};

export function MarketingAudienceFields({ settings, setSettings, t }: Props) {
  const recipients = settings.marketingTestRecipients ?? [];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Label htmlFor="marketing-test-recipients">
          {t("test-recipients")}
        </Label>
        <p className="mb-2 text-sm text-muted-foreground">
          {t("test-recipients-hint")}
        </p>
        <Textarea
          id="marketing-test-recipients"
          name="marketing-test-recipients"
          rows={3}
          autoComplete="off"
          placeholder={t("test-recipients-placeholder")}
          value={recipients.join("\n")}
          onChange={(event) =>
            setSettings((prev) => ({
              ...prev,
              marketingTestRecipients: event.target.value
                .split(/[,\n]/)
                .map((value) => value.trim())
                .filter(Boolean),
            }))
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="marketing-whatsapp-cap">{t("whatsapp-cap")}</Label>
          <Input
            id="marketing-whatsapp-cap"
            name="marketing-whatsapp-cap"
            type="number"
            min={1}
            max={1000}
            inputMode="numeric"
            value={settings.marketingWhatsappDailyCap ?? WHATSAPP_MARKETING_DAILY_CAP}
            onChange={(event) =>
              setSettings((prev) => ({
                ...prev,
                marketingWhatsappDailyCap: Number(event.target.value),
              }))
            }
          />
        </div>
        <div>
          <Label htmlFor="marketing-quiet-start">{t("quiet-start")}</Label>
          <Input
            id="marketing-quiet-start"
            name="marketing-quiet-start"
            type="number"
            min={0}
            max={23}
            inputMode="numeric"
            value={
              settings.marketingQuietHoursStart ??
              MARKETING_QUIET_HOURS.startHour
            }
            onChange={(event) =>
              setSettings((prev) => ({
                ...prev,
                marketingQuietHoursStart: Number(event.target.value),
              }))
            }
          />
        </div>
        <div>
          <Label htmlFor="marketing-quiet-end">{t("quiet-end")}</Label>
          <Input
            id="marketing-quiet-end"
            name="marketing-quiet-end"
            type="number"
            min={0}
            max={23}
            inputMode="numeric"
            value={
              settings.marketingQuietHoursEnd ?? MARKETING_QUIET_HOURS.endHour
            }
            onChange={(event) =>
              setSettings((prev) => ({
                ...prev,
                marketingQuietHoursEnd: Number(event.target.value),
              }))
            }
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="marketing-track-opens">{t("track-opens")}</Label>
          <Switch
            id="marketing-track-opens"
            checked={settings.marketingTrackOpens ?? false}
            onCheckedChange={(checked) =>
              setSettings((prev) => ({ ...prev, marketingTrackOpens: checked }))
            }
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="marketing-track-clicks">{t("track-clicks")}</Label>
          <Switch
            id="marketing-track-clicks"
            checked={settings.marketingTrackClicks ?? false}
            onCheckedChange={(checked) =>
              setSettings((prev) => ({ ...prev, marketingTrackClicks: checked }))
            }
          />
        </div>
      </div>
    </div>
  );
}
