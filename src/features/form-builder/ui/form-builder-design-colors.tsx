"use client";

import type { FormBuilderStyleEditorProps } from "@/components/form-builder/form-builder-style-editor-props";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Palette } from "lucide-react";

export function FormBuilderDesignColors({
  formStyle,
  setFormStyle,
}: FormBuilderStyleEditorProps) {
  return (
    <>
                      {/* INPUT & TEXT COLORS */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Palette className="h-4 w-4 text-primary" />
                          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Text & Input Colors</Label>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Body Text Color</Label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={formStyle.textColor}
                              onChange={(e) => setFormStyle((s) => ({ ...s, textColor: e.target.value }))}
                              className="h-8 w-8 rounded cursor-pointer border-0 p-0"
                            />
                            <Input className="h-8 text-xs font-mono flex-1" value={formStyle.textColor} onChange={(e) => setFormStyle((s) => ({ ...s, textColor: e.target.value }))} />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Label Color</Label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={formStyle.labelColor}
                              onChange={(e) => setFormStyle((s) => ({ ...s, labelColor: e.target.value }))}
                              className="h-8 w-8 rounded cursor-pointer border-0 p-0"
                            />
                            <Input className="h-8 text-xs font-mono flex-1" value={formStyle.labelColor} onChange={(e) => setFormStyle((s) => ({ ...s, labelColor: e.target.value }))} />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Input Text Color</Label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={formStyle.inputTextColor}
                              onChange={(e) => setFormStyle((s) => ({ ...s, inputTextColor: e.target.value }))}
                              className="h-8 w-8 rounded cursor-pointer border-0 p-0"
                            />
                            <Input className="h-8 text-xs font-mono flex-1" value={formStyle.inputTextColor} onChange={(e) => setFormStyle((s) => ({ ...s, inputTextColor: e.target.value }))} />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Input Background Color</Label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={formStyle.inputBackgroundColor}
                              onChange={(e) => setFormStyle((s) => ({ ...s, inputBackgroundColor: e.target.value }))}
                              className="h-8 w-8 rounded cursor-pointer border-0 p-0"
                            />
                            <Input className="h-8 text-xs font-mono flex-1" value={formStyle.inputBackgroundColor} onChange={(e) => setFormStyle((s) => ({ ...s, inputBackgroundColor: e.target.value }))} />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Input Border Color</Label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={formStyle.inputBorderColor}
                              onChange={(e) => setFormStyle((s) => ({ ...s, inputBorderColor: e.target.value }))}
                              className="h-8 w-8 rounded cursor-pointer border-0 p-0"
                            />
                            <Input className="h-8 text-xs font-mono flex-1" value={formStyle.inputBorderColor} onChange={(e) => setFormStyle((s) => ({ ...s, inputBorderColor: e.target.value }))} />
                          </div>
                        </div>
                      </div>
    </>
  );
}
