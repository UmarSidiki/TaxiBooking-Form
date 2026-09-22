"use client";

import type { FormBuilderStyleEditorProps } from "@/features/form-builder/ui/form-builder-style-editor-props";
import { Label } from "@/shared/ui/label";
import { Switch } from "@/shared/ui/switch";

export function FormBuilderDesignVisibility({
  t,
  formStyle,
  setFormStyle,
}: FormBuilderStyleEditorProps) {
  return (
    <div className="space-y-3 rounded-lg bg-muted/30 p-4">
      <Label className="text-xs font-semibold text-muted-foreground">
        {t("ui.visibility")}
      </Label>
      <div className="flex min-h-11 items-center justify-between gap-3">
        <Label className="text-xs font-medium">{t("show_header")}</Label>
        <Switch
          aria-label={t("show_header")}
          checked={formStyle.showHeader}
          onCheckedChange={(showHeader) =>
            setFormStyle((style) => ({ ...style, showHeader }))
          }
        />
      </div>
      <div className="flex min-h-11 items-center justify-between gap-3">
        <Label className="text-xs font-medium">{t("ui.show_steps")}</Label>
        <Switch
          aria-label={t("ui.show_steps")}
          checked={formStyle.showSteps}
          onCheckedChange={(showSteps) =>
            setFormStyle((style) => ({ ...style, showSteps }))
          }
        />
      </div>
      <div className="flex min-h-11 items-center justify-between gap-3">
        <Label className="text-xs font-medium">{t("show_footer")}</Label>
        <Switch
          aria-label={t("show_footer")}
          checked={formStyle.showFooter}
          onCheckedChange={(showFooter) =>
            setFormStyle((style) => ({ ...style, showFooter }))
          }
        />
      </div>
    </div>
  );
}
