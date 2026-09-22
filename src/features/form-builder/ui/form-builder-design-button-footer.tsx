"use client";

import { FormBuilderAlignToggle } from "@/features/form-builder/ui/form-builder-align-toggle";
import { FormBuilderColorField } from "@/features/form-builder/ui/form-builder-color-field";
import type { FormBuilderStyleEditorProps } from "@/features/form-builder/ui/form-builder-style-editor-props";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Separator } from "@/shared/ui/separator";
import { Switch } from "@/shared/ui/switch";
import { Settings2, Type } from "lucide-react";

export function FormBuilderDesignButtonFooter({
  t,
  formStyle,
  setFormStyle,
}: FormBuilderStyleEditorProps) {
  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Settings2 className="size-4 text-primary" />
          <Label className="text-xs font-semibold text-muted-foreground">
            {t("ui.buttons")}
          </Label>
        </div>
        <div className="space-y-2 rounded-md border border-border bg-muted/20 p-3">
          <Label className="text-xs font-medium text-muted-foreground">
            {t("button_properties.search_button")}
          </Label>
          <p className="text-xs text-muted-foreground">
            {t("button_properties.click_to_configure")}
          </p>
        </div>
        <div className="space-y-3 rounded-md border border-border bg-muted/20 p-3">
          <Label className="text-xs font-medium text-muted-foreground">
            {t("ui.booking_type_button")}
          </Label>
          <FormBuilderColorField
            label={t("button_properties.background_color")}
            value={formStyle.bookingTypeButtonColor || "#0f172a"}
            onChange={(bookingTypeButtonColor) =>
              setFormStyle((style) => ({ ...style, bookingTypeButtonColor }))
            }
          />
          <FormBuilderColorField
            label={t("button_properties.text_color")}
            value={formStyle.bookingTypeButtonTextColor || "#ffffff"}
            onChange={(bookingTypeButtonTextColor) =>
              setFormStyle((style) => ({ ...style, bookingTypeButtonTextColor }))
            }
          />
        </div>
      </div>
      <Separator />
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Type className="size-4 text-primary" />
          <Label className="text-xs font-semibold text-muted-foreground">
            {t("ui.footer")}
          </Label>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">{t("footer_text")}</Label>
          <Input
            aria-label={t("footer_text")}
            value={formStyle.footerText}
            onChange={(event) =>
              setFormStyle((style) => ({ ...style, footerText: event.target.value }))
            }
            className="h-11 text-sm"
            placeholder={t("ui.footer_placeholder")}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">{t("ui.text_alignment")}</Label>
          <FormBuilderAlignToggle
            t={t}
            value={formStyle.footerTextAlignment ?? "center"}
            onChange={(footerTextAlignment) =>
              setFormStyle((style) => ({ ...style, footerTextAlignment }))
            }
          />
        </div>
        <div className="flex min-h-11 items-center justify-between gap-3">
          <Label className="text-xs font-medium">{t("ui.show_footer_images")}</Label>
          <Switch
            aria-label={t("ui.show_footer_images")}
            checked={formStyle.showFooterImages}
            onCheckedChange={(showFooterImages) =>
              setFormStyle((style) => ({ ...style, showFooterImages }))
            }
          />
        </div>
      </div>
    </>
  );
}
