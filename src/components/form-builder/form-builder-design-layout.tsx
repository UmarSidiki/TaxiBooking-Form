"use client";

import type { FormBuilderStyleEditorProps } from "@/components/form-builder/form-builder-style-editor-props";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Columns, CornerDownRight } from "lucide-react";

export function FormBuilderDesignLayout({
  formStyle,
  setFormStyle,
}: FormBuilderStyleEditorProps) {
  return (
    <>
                      {/* VISIBILITY TOGGLES */}
                      <div className="space-y-3 bg-muted/30 p-4 rounded-lg">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Visibility</Label>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium">Show Header</Label>
                            <Switch checked={formStyle.showHeader} onCheckedChange={(c) => setFormStyle((s) => ({ ...s, showHeader: c }))} />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium">Show Steps</Label>
                            <Switch checked={formStyle.showSteps} onCheckedChange={(c) => setFormStyle((s) => ({ ...s, showSteps: c }))} />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium">Show Footer</Label>
                            <Switch checked={formStyle.showFooter} onCheckedChange={(c) => setFormStyle((s) => ({ ...s, showFooter: c }))} />
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* LAYOUT & GRID */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Columns className="h-4 w-4 text-primary" />
                          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Layout</Label>
                        </div>
                        <div className="space-y-3 pl-1">
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <Label className="text-xs font-medium">Desktop Columns</Label>
                              <span className="text-xs font-mono bg-muted px-1.5 rounded">{formStyle.columns || 2}</span>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="12"
                              step="1"
                              value={formStyle.columns || 2}
                              onChange={(e) => setFormStyle((s) => ({ ...s, columns: parseInt(e.target.value) }))}
                              className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                            <div className="flex justify-between text-[9px] text-muted-foreground px-1 font-mono">
                              <span>1</span><span>6</span><span>12</span>
                            </div>
                          </div>
                          
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <Label className="text-xs font-medium">Field Gap</Label>
                              <span className="text-xs font-mono bg-muted px-1.5 rounded">{formStyle.fieldGap ?? 12}px</span>
                            </div>
                            <input
                              type="range"
                              min="4"
                              max="32"
                              step="2"
                              value={formStyle.fieldGap ?? 12}
                              onChange={(e) => setFormStyle((s) => ({ ...s, fieldGap: parseInt(e.target.value) }))}
                              className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* BACKGROUND & APPEARANCE */}
                      <div className="space-y-3">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Background & Effects</Label>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-[10px]">Background Color</Label>
                            <div className="flex items-center gap-2">
                              <input type="color" value={formStyle.backgroundColor} onChange={(e) => setFormStyle((s) => ({ ...s, backgroundColor: e.target.value }))} className="h-8 w-8 rounded cursor-pointer border-0 p-0" />
                              <Input className="h-8 text-xs font-mono" value={formStyle.backgroundColor} onChange={(e) => setFormStyle((s) => ({ ...s, backgroundColor: e.target.value }))} />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px]">Primary Color</Label>
                            <div className="flex items-center gap-2">
                              <input type="color" value={formStyle.primaryColor} onChange={(e) => setFormStyle((s) => ({ ...s, primaryColor: e.target.value }))} className="h-8 w-8 rounded cursor-pointer border-0 p-0" />
                              <Input className="h-8 text-xs font-mono" value={formStyle.primaryColor} onChange={(e) => setFormStyle((s) => ({ ...s, primaryColor: e.target.value }))} />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <Label className="text-xs font-medium">Transparency</Label>
                            <span className="text-xs font-mono bg-muted px-1.5 rounded">{formStyle.backgroundOpacity}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={formStyle.backgroundOpacity}
                            onChange={(e) => setFormStyle((s) => ({ ...s, backgroundOpacity: parseInt(e.target.value) }))}
                            className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                          />
                          <div className="flex justify-between text-[9px] text-muted-foreground px-1">
                            <span>Transparent</span><span>Opaque</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <Label className="text-xs font-medium">Glass Effect</Label>
                          <Switch checked={formStyle.glassEffect} onCheckedChange={(c) => setFormStyle((s) => ({ ...s, glassEffect: c }))} />
                        </div>
                      </div>

                      <Separator />

                      {/* BORDER RADIUS */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <CornerDownRight className="h-4 w-4 text-primary" />
                          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Border Radius</Label>
                        </div>
                        <div className="space-y-3 pl-1">
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <Label className="text-xs font-medium">Container Radius</Label>
                              <span className="text-xs font-mono bg-muted px-1.5 rounded">{formStyle.borderRadius}</span>
                            </div>
                            <Input
                              value={formStyle.borderRadius}
                              onChange={(e) => setFormStyle((s) => ({ ...s, borderRadius: e.target.value }))}
                              className="h-8 text-xs font-mono"
                              placeholder="0.75rem"
                            />
                            <p className="text-[10px] text-muted-foreground">Use rem, px, or % units (e.g., 0.75rem, 12px)</p>
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <Label className="text-xs font-medium">Input Radius</Label>
                              <span className="text-xs font-mono bg-muted px-1.5 rounded">{formStyle.inputBorderRadius || "0.5rem"}</span>
                            </div>
                            <Input
                              value={formStyle.inputBorderRadius || "0.5rem"}
                              onChange={(e) => setFormStyle((s) => ({ ...s, inputBorderRadius: e.target.value }))}
                              className="h-8 text-xs font-mono"
                              placeholder="0.5rem"
                            />
                            <p className="text-[10px] text-muted-foreground">Use rem, px, or % units (e.g., 0.5rem, 8px)</p>
                          </div>
                        </div>
                      </div>
    </>
  );
}
