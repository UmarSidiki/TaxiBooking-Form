"use client";

import {
  Users,
  Car,
  Code,
  Wrench,
  CalendarClock,
  CalendarPlus,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Switch } from "@/shared/ui/switch";
import type { ISetting } from "@/features/settings/model";
import type { SettingsDeskPatch } from "@/features/settings/ui/settings-desk-props";

export default function FeaturesTab({
  settings,
  onSettingsChange,
}: {
  settings: Partial<ISetting>;
  onSettingsChange: SettingsDeskPatch;
}) {
  const t = useTranslations("Dashboard.Features");
  const partnersOn = settings.enablePartners ?? false;

  return (
    <div className="flex flex-col gap-3">
      <ModuleRow
        id="enablePartners"
        icon={Users}
        title={t("partners-module")}
        description={t("enable-partner-registration")}
        checked={partnersOn}
        onCheckedChange={(checked) =>
          onSettingsChange("enablePartners", checked)
        }
      />
      {partnersOn ? (
        <div className="flex flex-col gap-4 rounded-md border border-border p-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {t("dispatch-settlement-title")}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("dispatch-settlement-description")}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="partnerCashSettlement">
              {t("cash-settlement-label")}
            </Label>
            <Select
              value={settings.partnerCashSettlement ?? "keep_cash"}
              onValueChange={(value) =>
                onSettingsChange(
                  "partnerCashSettlement",
                  value as ISetting["partnerCashSettlement"]
                )
              }
            >
              <SelectTrigger
                id="partnerCashSettlement"
                className="h-11 w-full max-w-md"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="keep_cash">
                    {t("cash-settlement-keep-cash")}
                  </SelectItem>
                  <SelectItem value="operator_margin">
                    {t("cash-settlement-operator-margin")}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t("cash-settlement-help")}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="dispatchAssigneeMode">
              {t("dispatch-mode-label")}
            </Label>
            <Select
              value={settings.dispatchAssigneeMode ?? "exclusive"}
              onValueChange={(value) =>
                onSettingsChange(
                  "dispatchAssigneeMode",
                  value as ISetting["dispatchAssigneeMode"]
                )
              }
            >
              <SelectTrigger
                id="dispatchAssigneeMode"
                className="h-11 w-full max-w-md"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="exclusive">
                    {t("dispatch-mode-exclusive")}
                  </SelectItem>
                  <SelectItem value="allow_both">
                    {t("dispatch-mode-allow-both")}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t("dispatch-mode-help")}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="defaultPartnerMarginPercentage">
              {t("default-margin-label")}
            </Label>
            <Input
              id="defaultPartnerMarginPercentage"
              name="defaultPartnerMarginPercentage"
              type="number"
              min={0}
              max={100}
              step={1}
              inputMode="decimal"
              className="h-11 max-w-[8rem]"
              value={settings.defaultPartnerMarginPercentage ?? 20}
              onChange={(e) => {
                const n = Number(e.target.value);
                onSettingsChange(
                  "defaultPartnerMarginPercentage",
                  Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 20
                );
              }}
            />
            <p className="text-xs text-muted-foreground">
              {t("default-margin-help")}
            </p>
          </div>
        </div>
      ) : null}
      <ModuleRow
        id="enableAppointmentRequest"
        icon={CalendarClock}
        title={t("appointment-request-module")}
        description={t("enable-appointment-request")}
        checked={settings.enableAppointmentRequest ?? false}
        onCheckedChange={(checked) =>
          onSettingsChange("enableAppointmentRequest", checked)
        }
      />
      <ModuleRow
        id="enableDeskBooking"
        icon={CalendarPlus}
        title={t("desk-booking-module")}
        description={t("enable-desk-booking")}
        checked={settings.enableDeskBooking ?? false}
        onCheckedChange={(checked) =>
          onSettingsChange("enableDeskBooking", checked)
        }
      />
      <ModuleRow
        id="enableDrivers"
        icon={Car}
        title={t("drivers-module-legacy")}
        description={t("enable-the-legacy-drivers-system")}
        checked={settings.enableDrivers ?? false}
        onCheckedChange={(checked) =>
          onSettingsChange("enableDrivers", checked)
        }
      />
      <ModuleRow
        id="enableEmbeddableForm"
        icon={Code}
        title={t("embeddable-form-module")}
        description={t("enable-embeddable-booking-form")}
        checked={settings.enableEmbeddableForm ?? true}
        onCheckedChange={(checked) =>
          onSettingsChange("enableEmbeddableForm", checked)
        }
      />
      <ModuleRow
        id="enableFormBuilder"
        icon={Wrench}
        title={t("form-builder-module")}
        description={t("enable-form-builder")}
        checked={settings.enableFormBuilder ?? true}
        onCheckedChange={(checked) =>
          onSettingsChange("enableFormBuilder", checked)
        }
      />
      <p className="text-sm text-muted-foreground">
        {t("note-changes-to-module-settings")}
      </p>
    </div>
  );
}

function ModuleRow({
  id,
  icon: Icon,
  title,
  description,
  checked,
  onCheckedChange,
}: {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-md border border-border p-4">
      <div className="min-w-0 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-primary" aria-hidden="true" />
          <label htmlFor={id} className="cursor-pointer text-sm font-semibold">
            {title}
          </label>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="mt-0.5"
      />
    </div>
  );
}
