"use client";

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
                      {/* BUTTON STYLING */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Settings2 className="h-4 w-4 text-primary" />
                          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Buttons</Label>
                        </div>

                        <div className="space-y-2 bg-muted/20 p-3 rounded border border-muted">
                          <Label className="text-xs font-medium text-muted-foreground">{t("button_properties.search_button")}</Label>
                          <p className="text-[10px] text-muted-foreground">{t("button_properties.click_to_configure")}</p>
                        </div>

                        <div className="space-y-2 bg-muted/20 p-3 rounded border border-muted">
                          <Label className="text-xs font-medium text-muted-foreground">Booking Type Button</Label>
                          <div className="space-y-1.5">
                            <Label className="text-[10px]">Background Color</Label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={formStyle.bookingTypeButtonColor || "#0f172a"}
                                onChange={(e) => setFormStyle((s) => ({ ...s, bookingTypeButtonColor: e.target.value }))}
                                className="h-7 w-7 rounded cursor-pointer border-0 p-0"
                              />
                              <Input className="h-7 text-xs font-mono flex-1" value={formStyle.bookingTypeButtonColor || "#0f172a"} onChange={(e) => setFormStyle((s) => ({ ...s, bookingTypeButtonColor: e.target.value }))} />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[10px]">Text Color</Label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={formStyle.bookingTypeButtonTextColor || "#ffffff"}
                                onChange={(e) => setFormStyle((s) => ({ ...s, bookingTypeButtonTextColor: e.target.value }))}
                                className="h-7 w-7 rounded cursor-pointer border-0 p-0"
                              />
                              <Input className="h-7 text-xs font-mono flex-1" value={formStyle.bookingTypeButtonTextColor || "#ffffff"} onChange={(e) => setFormStyle((s) => ({ ...s, bookingTypeButtonTextColor: e.target.value }))} />
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* FOOTER SECTION */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Type className="h-4 w-4 text-primary" />
                          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Footer</Label>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Footer Text</Label>
                          <Input
                            value={formStyle.footerText}
                            onChange={(e) => setFormStyle((s) => ({ ...s, footerText: e.target.value }))}
                            className="h-8 text-xs"
                            placeholder="Enter footer text"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Text Alignment</Label>
                          <div className="flex gap-1">
                            {(['left', 'center', 'right'] as const).map((align) => (
                              <button
                                key={align}
                                onClick={() => setFormStyle((s) => ({ ...s, footerTextAlignment: align }))}
                                className={`flex-1 py-1.5 rounded text-xs font-medium transition-all ${
                                  formStyle.footerTextAlignment === align
                                    ? 'bg-primary text-white'
                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                }`}
                                title={align.charAt(0).toUpperCase() + align.slice(1)}
                              >
                                {align === 'left' ? '←' : align === 'center' ? '↔' : '→'}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-medium">Show Footer Images</Label>
                          <Switch checked={formStyle.showFooterImages} onCheckedChange={(c) => setFormStyle((s) => ({ ...s, showFooterImages: c }))} />
                        </div>
                      </div>
    </>
  );
}
