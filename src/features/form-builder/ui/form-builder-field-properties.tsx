"use client";

import { FIELD_REGISTRY } from "@/features/form-builder/ui/field-registry";
import { FormBuilderFieldWidths } from "@/features/form-builder/ui/form-builder-field-widths";
import { Badge } from "@/shared/ui/badge";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Separator } from "@/shared/ui/separator";
import { Switch } from "@/shared/ui/switch";
import type { IFormField } from "@/features/form-builder/model";
import { Eye, MapPin } from "lucide-react";
import type { useTranslations } from "next-intl";

export function FormBuilderFieldProperties({
  t,
  selectedField,
  updateField,
  toggleField,
}: {
  t: ReturnType<typeof useTranslations<"FormBuilder">>;
  selectedField: IFormField;
  updateField: (id: string, updates: Partial<IFormField>) => void;
  toggleField: (id: string) => void;
}) {
  const registry = FIELD_REGISTRY[selectedField.type];
  const Icon = registry?.icon || MapPin;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-3">
        <div className="rounded-md bg-primary/10 p-2.5">
          <Icon className="size-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold">{t(registry.labelKey)}</p>
          <p className="text-xs text-muted-foreground">{t(registry.descriptionKey)}</p>
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-xs font-semibold text-muted-foreground">
          {t("button_properties.content")}
        </Label>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">{t("header_text")}</Label>
          <Input
            name={`field-${selectedField.id}-label`}
            aria-label={t("header_text")}
            value={selectedField.label}
            onChange={(event) =>
              updateField(selectedField.id, { label: event.target.value })
            }
            className="h-11 text-sm"
          />
        </div>
        {!["booking-type", "trip-type", "stops"].includes(selectedField.type) ? (
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">{t("placeholder")}</Label>
            <Input
              name={`field-${selectedField.id}-placeholder`}
              aria-label={t("placeholder")}
              value={selectedField.placeholder || ""}
              onChange={(event) =>
                updateField(selectedField.id, { placeholder: event.target.value })
              }
              className="h-11 text-sm"
            />
          </div>
        ) : null}
      </div>

      <Separator />
      <FormBuilderFieldWidths
        t={t}
        selectedField={selectedField}
        updateField={updateField}
      />
      <Separator />

      <div className="space-y-3">
        <Label className="text-xs font-semibold text-muted-foreground">
          {t("ui.logic_validation")}
        </Label>
        <div className="flex items-center justify-between gap-3">
          <div>
            <Label className="text-xs font-medium">{t("required")}</Label>
            {registry?.locked ? (
              <p className="text-xs text-muted-foreground">{t("ui.core_field")}</p>
            ) : null}
          </div>
          <Switch
            aria-label={t("required")}
            checked={selectedField.required}
            disabled={registry?.locked}
            onCheckedChange={(checked) =>
              updateField(selectedField.id, { required: checked })
            }
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <Label className="text-xs font-medium">{t("enabled")}</Label>
          <Switch
            aria-label={t("enabled")}
            checked={selectedField.enabled}
            disabled={registry?.locked}
            onCheckedChange={() => toggleField(selectedField.id)}
          />
        </div>
      </div>

      {["booking-type", "trip-type"].includes(selectedField.type) ? (
        <div className="space-y-3">
          <Separator />
          <Label className="text-xs font-semibold text-muted-foreground">
            {t("ui.styling")}
          </Label>
          <div className="flex items-center justify-between gap-3">
            <div>
              <Label className="text-xs font-medium">{t("ui.remove_border")}</Label>
              <p className="text-xs text-muted-foreground">
                {t("ui.remove_border_help")}
              </p>
            </div>
            <Switch
              aria-label={t("ui.remove_border")}
              checked={selectedField.showBorder === false}
              onCheckedChange={(removing) =>
                updateField(selectedField.id, { showBorder: !removing })
              }
            />
          </div>
        </div>
      ) : null}

      {selectedField.visibleWhen ? (
        <div className="space-y-2 rounded-md border border-primary/20 bg-primary/10 p-3">
          <p className="text-xs font-semibold text-foreground">
            {t("ui.visibility")}
          </p>
          {selectedField.visibleWhen.bookingType ? (
            <div className="flex items-center gap-2 text-xs text-foreground">
              <Eye className="size-3" />
              <span>
                {t("ui.only_in_mode", {
                  mode: selectedField.visibleWhen.bookingType,
                })}
              </span>
              <Badge variant="secondary" className="bg-card text-xs">
                {selectedField.visibleWhen.bookingType}
              </Badge>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
