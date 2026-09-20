"use client";

import type { ReactNode } from "react";
import type { IFormField } from "@/features/form-builder/model";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Clock, Monitor, Smartphone } from "lucide-react";
import type { useTranslations } from "next-intl";

type Width = IFormField["width"];

export function FormBuilderFieldWidths({
  t,
  selectedField,
  updateField,
}: {
  t: ReturnType<typeof useTranslations<"FormBuilder">>;
  selectedField: IFormField;
  updateField: (id: string, updates: Partial<IFormField>) => void;
}) {
  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Monitor className="size-3.5 text-muted-foreground" />
          <Label className="text-xs font-semibold text-muted-foreground">
            {t("ui.desktop_layout")}
          </Label>
        </div>
        <WidthSelect
          t={t}
          label={t("ui.grid_width")}
          value={selectedField.width}
          onChange={(width) => {
            if (width !== "inherit") {
              updateField(selectedField.id, { width });
            }
          }}
        />
        {!selectedField.visibleWhen?.bookingType ? (
          <WidthSelect
            t={t}
            label={t("ui.width_hourly")}
            hint={t("ui.optional")}
            icon={<Clock className="size-3" />}
            value={selectedField.widthWhenHourly || "inherit"}
            includeInherit={t("ui.same_as_default")}
            onChange={(width) =>
              updateField(selectedField.id, {
                widthWhenHourly: width === "inherit" ? undefined : width,
              })
            }
          />
        ) : null}
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Smartphone className="size-3.5 text-muted-foreground" />
          <Label className="text-xs font-semibold text-muted-foreground">
            {t("ui.mobile_layout")}
          </Label>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("ui.width_mobile_description")}
        </p>
        <WidthSelect
          t={t}
          label={t("ui.width_mobile")}
          value={selectedField.mobileWidth || "inherit"}
          includeInherit={t("ui.same_as_desktop")}
          onChange={(width) =>
            updateField(selectedField.id, {
              mobileWidth: width === "inherit" ? undefined : width,
            })
          }
        />
        <WidthSelect
          t={t}
          label={t("ui.width_hourly")}
          hint={t("ui.optional")}
          icon={<Clock className="size-3" />}
          value={selectedField.mobileWidthWhenHourly || "inherit"}
          includeInherit={t("ui.same_as_mobile_default")}
          onChange={(width) =>
            updateField(selectedField.id, {
              mobileWidthWhenHourly: width === "inherit" ? undefined : width,
            })
          }
        />
      </div>
    </>
  );
}

function WidthSelect({
  t,
  label,
  hint,
  icon,
  value,
  onChange,
  includeInherit,
}: {
  t: ReturnType<typeof useTranslations<"FormBuilder">>;
  label: string;
  hint?: string;
  icon?: ReactNode;
  value: string;
  onChange: (width: Width | "inherit") => void;
  includeInherit?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-xs font-medium">
        {icon}
        {label}
        {hint ? (
          <span className="ms-auto text-xs font-normal text-muted-foreground">
            {hint}
          </span>
        ) : null}
      </Label>
      <Select value={value} onValueChange={(next) => onChange(next as Width)}>
        <SelectTrigger className="h-11 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {includeInherit ? (
            <SelectItem value="inherit">{includeInherit}</SelectItem>
          ) : null}
          <SelectItem value="full">{t("ui.full_width_pct")}</SelectItem>
          <SelectItem value="two-thirds">{t("button_properties.two_thirds")}</SelectItem>
          <SelectItem value="half">{t("button_properties.half")}</SelectItem>
          <SelectItem value="third">{t("button_properties.third")}</SelectItem>
          <SelectItem value="quarter">{t("button_properties.quarter")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
