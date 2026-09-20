"use client";

import { FormBuilderColorField } from "@/features/form-builder/ui/form-builder-color-field";
import type { FormBuilderStyleEditorProps } from "@/features/form-builder/ui/form-builder-style-editor-props";
import { Label } from "@/shared/ui/label";
import { Palette } from "lucide-react";

export function FormBuilderDesignColors({
  t,
  formStyle,
  setFormStyle,
}: FormBuilderStyleEditorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Palette className="size-4 text-primary" />
        <Label className="text-xs font-semibold text-muted-foreground">
          {t("ui.text_and_input")}
        </Label>
      </div>
      <FormBuilderColorField
        label={t("ui.body_text_color")}
        value={formStyle.textColor}
        onChange={(textColor) => setFormStyle((style) => ({ ...style, textColor }))}
      />
      <FormBuilderColorField
        label={t("label_color")}
        value={formStyle.labelColor}
        onChange={(labelColor) =>
          setFormStyle((style) => ({ ...style, labelColor }))
        }
      />
      <FormBuilderColorField
        label={t("ui.input_text_color")}
        value={formStyle.inputTextColor}
        onChange={(inputTextColor) =>
          setFormStyle((style) => ({ ...style, inputTextColor }))
        }
      />
      <FormBuilderColorField
        label={t("ui.input_background")}
        value={formStyle.inputBackgroundColor}
        onChange={(inputBackgroundColor) =>
          setFormStyle((style) => ({ ...style, inputBackgroundColor }))
        }
      />
      <FormBuilderColorField
        label={t("ui.border_color")}
        value={formStyle.inputBorderColor}
        onChange={(inputBorderColor) =>
          setFormStyle((style) => ({ ...style, inputBorderColor }))
        }
      />
    </div>
  );
}
