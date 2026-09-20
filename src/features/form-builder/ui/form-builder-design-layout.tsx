"use client";

import { FormBuilderColorField } from "@/features/form-builder/ui/form-builder-color-field";
import { FormBuilderDesignVisibility } from "@/features/form-builder/ui/form-builder-design-visibility";
import type { FormBuilderStyleEditorProps } from "@/features/form-builder/ui/form-builder-style-editor-props";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Separator } from "@/shared/ui/separator";
import { Switch } from "@/shared/ui/switch";
import { Columns, CornerDownRight } from "lucide-react";

export function FormBuilderDesignLayout(props: FormBuilderStyleEditorProps) {
  const { t, formStyle, setFormStyle } = props;
  return (
    <>
      <FormBuilderDesignVisibility {...props} />
      <Separator />
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Columns className="size-4 text-primary" />
          <Label className="text-xs font-semibold text-muted-foreground">
            {t("button_properties.layout")}
          </Label>
        </div>
        <RangeField
          label={t("ui.desktop_columns")}
          value={formStyle.columns || 2}
          min={1}
          max={12}
          step={1}
          onChange={(columns) => setFormStyle((style) => ({ ...style, columns }))}
        />
        <RangeField
          label={t("ui.field_gap")}
          display={`${formStyle.fieldGap ?? 12}px`}
          value={formStyle.fieldGap ?? 12}
          min={4}
          max={32}
          step={2}
          onChange={(fieldGap) => setFormStyle((style) => ({ ...style, fieldGap }))}
        />
      </div>
      <Separator />
      <div className="space-y-3">
        <Label className="text-xs font-semibold text-muted-foreground">
          {t("ui.background_effects")}
        </Label>
        <FormBuilderColorField
          label={t("background_color")}
          value={formStyle.backgroundColor}
          onChange={(backgroundColor) =>
            setFormStyle((style) => ({ ...style, backgroundColor }))
          }
        />
        <FormBuilderColorField
          label={t("primary_color")}
          value={formStyle.primaryColor}
          onChange={(primaryColor) =>
            setFormStyle((style) => ({ ...style, primaryColor }))
          }
        />
        <RangeField
          label={t("ui.transparency")}
          display={`${formStyle.backgroundOpacity}%`}
          value={formStyle.backgroundOpacity}
          min={0}
          max={100}
          step={5}
          onChange={(backgroundOpacity) =>
            setFormStyle((style) => ({ ...style, backgroundOpacity }))
          }
        />
        <div className="flex min-h-11 items-center justify-between gap-3">
          <Label className="text-xs font-medium">{t("glass_effect")}</Label>
          <Switch
            checked={formStyle.glassEffect}
            onCheckedChange={(glassEffect) =>
              setFormStyle((style) => ({ ...style, glassEffect }))
            }
          />
        </div>
      </div>
      <Separator />
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <CornerDownRight className="size-4 text-primary" />
          <Label className="text-xs font-semibold text-muted-foreground">
            {t("border_radius")}
          </Label>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">{t("ui.container_radius")}</Label>
          <Input
            value={formStyle.borderRadius}
            onChange={(event) =>
              setFormStyle((style) => ({ ...style, borderRadius: event.target.value }))
            }
            className="h-11 font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">{t("ui.radius_units_help")}</p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">{t("input_border_radius")}</Label>
          <Input
            value={formStyle.inputBorderRadius || "0.5rem"}
            onChange={(event) =>
              setFormStyle((style) => ({
                ...style,
                inputBorderRadius: event.target.value,
              }))
            }
            className="h-11 font-mono text-sm"
          />
        </div>
      </div>
    </>
  );
}

function RangeField({
  label,
  value,
  display,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  display?: string;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium">{label}</Label>
        <span className="rounded-md bg-muted px-1.5 font-mono text-xs">
          {display ?? value}
        </span>
      </div>
      <Input
        type="number"
        className="h-11 w-full"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(parseInt(event.target.value, 10) || min)}
      />
    </div>
  );
}
