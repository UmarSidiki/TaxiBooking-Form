"use client";

import { Users, Car, Code, Wrench, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { Switch } from "@/shared/ui/switch";
import type { ISetting } from "@/features/settings/model";

export default function FeaturesTab({
  settings,
  onSettingsChange,
}: {
  settings: Partial<ISetting>;
  onSettingsChange: (key: keyof ISetting, value: boolean | number) => void;
}) {
  const t = useTranslations("Dashboard.Features");

  return (
    <div className="space-y-3">
      <ModuleRow
        id="enablePartners"
        icon={Users}
        title={t("partners-module")}
        description={t("enable-partner-registration")}
        checked={settings.enablePartners ?? false}
        onCheckedChange={(checked) => onSettingsChange("enablePartners", checked)}
      />
      <ModuleRow
        id="enableDrivers"
        icon={Car}
        title={t("drivers-module-legacy")}
        description={t("enable-the-legacy-drivers-system")}
        checked={settings.enableDrivers ?? false}
        onCheckedChange={(checked) => onSettingsChange("enableDrivers", checked)}
      />
      <ModuleRow
        id="enableEmbeddableForm"
        icon={Code}
        title={t("embeddable-form-module")}
        description={t("enable-embeddable-booking-form")}
        checked={settings.enableEmbeddableForm ?? true}
        onCheckedChange={(checked) => onSettingsChange("enableEmbeddableForm", checked)}
      />
      <ModuleRow
        id="enableFormBuilder"
        icon={Wrench}
        title={t("form-builder-module")}
        description={t("enable-form-builder")}
        checked={settings.enableFormBuilder ?? true}
        onCheckedChange={(checked) => onSettingsChange("enableFormBuilder", checked)}
      />
      <p className="text-sm text-muted-foreground">{t("note-changes-to-module-settings")}</p>
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
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-primary" aria-hidden="true" />
          <label htmlFor={id} className="cursor-pointer text-sm font-semibold">
            {title}
          </label>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} className="mt-0.5" />
    </div>
  );
}
