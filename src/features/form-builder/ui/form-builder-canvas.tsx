"use client";

import { FormPreview } from "@/features/form-builder/ui/form-preview";
import { Badge } from "@/shared/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import type { useFormBuilder } from "@/features/form-builder/hooks/useFormBuilder";
import { Grid3X3, Monitor, Smartphone } from "lucide-react";

type Builder = ReturnType<typeof useFormBuilder>;

export function FormBuilderCanvas({
  t,
  fields,
  setSelectedFieldId,
  previewMode,
  setPreviewMode,
  formStyle,
  isTabletOrMobile,
}: Pick<
  Builder,
  | "t"
  | "fields"
  | "setSelectedFieldId"
  | "previewMode"
  | "setPreviewMode"
  | "formStyle"
  | "isTabletOrMobile"
>) {
  return (
          <>
          {/* ── Center: Canvas ── */}
          <div className="lg:col-span-6">
            <Card className="border border-border bg-card overflow-hidden h-full flex flex-col">
              <CardHeader className="p-0 shrink-0">
                <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Grid3X3 className="h-4 w-4 text-primary" /> {t("preview")}
                      {isTabletOrMobile && (
                        <Badge variant="secondary" className="text-xs ms-2">{t("ui.width_mobile")}</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      {previewMode === "mobile"
                        ? t("ui.width_mobile")
                        : t("ui.grid_columns")}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1 bg-muted rounded-md p-0.5 border">
                    <button
                      onClick={() => setPreviewMode("desktop")}
                      disabled={isTabletOrMobile} // Disable manual override if auto-active
                      className={`p-1.5 rounded flex items-center gap-1.5 text-xs font-medium transition-shadow ${
                        previewMode === "desktop" ? "bg-card shadow-sm text-primary" : "hover:bg-card/50 text-muted-foreground"
                      } ${isTabletOrMobile ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Monitor className="h-3.5 w-3.5" /> {t("ui.grid_columns")}
                    </button>
                    <button
                      onClick={() => setPreviewMode("mobile")}
                      disabled={isTabletOrMobile}
                      className={`p-1.5 rounded flex items-center gap-1.5 text-xs font-medium transition-shadow ${
                        previewMode === "mobile" ? "bg-card shadow-sm text-primary" : "hover:bg-card/50 text-muted-foreground"
                      } ${isTabletOrMobile ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Smartphone className="h-3.5 w-3.5" /> {t("ui.width_mobile")}
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 items-center justify-center overflow-y-auto bg-background p-6">
                <div
                  className={`w-full transition-shadow duration-500 ease-in-out ${
                    previewMode === "mobile" ? "max-w-[360px] border-x-8 border-y-[16px] border-sidebar rounded-[2rem] shadow-2xl overflow-hidden bg-card" : "max-w-full"
                  }`}
                >
                  <FormPreview
                    fields={fields}
                    previewMode={previewMode}
                    style={formStyle}
                    onSelectField={(id) => setSelectedFieldId(id)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
          </>
  );
}
