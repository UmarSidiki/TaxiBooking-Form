"use client";

import { FormBuilderAlignToggle } from "@/features/form-builder/ui/form-builder-align-toggle";
import { FormBuilderColorField } from "@/features/form-builder/ui/form-builder-color-field";
import type { FormBuilderStyleEditorProps } from "@/features/form-builder/ui/form-builder-style-editor-props";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Type } from "lucide-react";

export function FormBuilderDesignHeader({
  t,
  formStyle,
  setFormStyle,
}: FormBuilderStyleEditorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Type className="size-4 text-primary" />
        <Label className="text-xs font-semibold text-muted-foreground">
          {t("ui.header")}
        </Label>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">{t("header_text")}</Label>
        <Input
          value={formStyle.headingText}
          onChange={(event) =>
            setFormStyle((style) => ({ ...style, headingText: event.target.value }))
          }
          className="h-11 text-sm"
          placeholder={t("ui.heading_placeholder")}
        />
      </div>
      <FormBuilderColorField
        label={t("ui.title_color")}
        value={formStyle.headingColor}
        onChange={(headingColor) =>
          setFormStyle((style) => ({ ...style, headingColor }))
        }
      />
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">{t("ui.title_alignment")}</Label>
        <FormBuilderAlignToggle
          t={t}
          value={formStyle.headingAlignment ?? "center"}
          onChange={(headingAlignment) =>
            setFormStyle((style) => ({ ...style, headingAlignment }))
          }
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">{t("ui.subtitle")}</Label>
        <Input
          value={formStyle.subHeadingText || ""}
          onChange={(event) =>
            setFormStyle((style) => ({
              ...style,
              subHeadingText: event.target.value,
            }))
          }
          className="h-11 text-sm"
          placeholder={t("ui.subtitle_placeholder")}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">{t("ui.subtitle_alignment")}</Label>
        <FormBuilderAlignToggle
          t={t}
          value={formStyle.subHeadingAlignment || "center"}
          onChange={(subHeadingAlignment) =>
            setFormStyle((style) => ({ ...style, subHeadingAlignment }))
          }
        />
      </div>
    </div>
  );
}
