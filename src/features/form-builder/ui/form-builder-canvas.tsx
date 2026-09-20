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
                <div className="px-4 pt-4 pb-3 border-b border-border/50 bg-gradient-to-r from-primary/5 to-primary/10 flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Grid3X3 className="h-4 w-4 text-primary" /> {t("preview")}
                      {isTabletOrMobile && (
                        <Badge variant="secondary" className="text-[10px] ml-2">Auto-Mobile</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      {previewMode === 'mobile' ? 'Mobile View (Auto)' : `Desktop Grid (${formStyle.columns || 2} Cols)`}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1 bg-muted rounded-md p-0.5 border">
                    <button
                      onClick={() => setPreviewMode("desktop")}
                      disabled={isTabletOrMobile} // Disable manual override if auto-active
                      className={`p-1.5 rounded flex items-center gap-1.5 text-xs font-medium transition-all ${
                        previewMode === "desktop" ? "bg-card shadow-sm text-primary" : "hover:bg-card/50 text-muted-foreground"
                      } ${isTabletOrMobile ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Monitor className="h-3.5 w-3.5" /> Desktop
                    </button>
                    <button
                      onClick={() => setPreviewMode("mobile")}
                      disabled={isTabletOrMobile}
                      className={`p-1.5 rounded flex items-center gap-1.5 text-xs font-medium transition-all ${
                        previewMode === "mobile" ? "bg-card shadow-sm text-primary" : "hover:bg-card/50 text-muted-foreground"
                      } ${isTabletOrMobile ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Smartphone className="h-3.5 w-3.5" /> Mobile
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 bg-slate-50/50 flex-1 overflow-y-auto flex items-center justify-center">
                <div
                  className={`w-full transition-all duration-500 ease-in-out ${
                    previewMode === "mobile" ? "max-w-[360px] border-x-8 border-y-[16px] border-slate-800 rounded-[2rem] shadow-2xl overflow-hidden bg-white" : "max-w-full"
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
