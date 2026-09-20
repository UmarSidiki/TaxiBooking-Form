"use client";

import type { FormBuilderStyleEditorProps } from "@/components/form-builder/form-builder-style-editor-props";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Type } from "lucide-react";

export function FormBuilderDesignHeader({
  formStyle,
  setFormStyle,
}: FormBuilderStyleEditorProps) {
  return (
    <>
                      {/* HEADER SECTION */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Type className="h-4 w-4 text-primary" />
                          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Header</Label>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Title</Label>
                          <Input
                            value={formStyle.headingText}
                            onChange={(e) => setFormStyle((s) => ({ ...s, headingText: e.target.value }))}
                            className="h-8 text-xs"
                            placeholder="Enter header text"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Title Color</Label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={formStyle.headingColor}
                              onChange={(e) => setFormStyle((s) => ({ ...s, headingColor: e.target.value }))}
                              className="h-8 w-8 rounded cursor-pointer border-0 p-0"
                            />
                            <Input className="h-8 text-xs font-mono flex-1" value={formStyle.headingColor} onChange={(e) => setFormStyle((s) => ({ ...s, headingColor: e.target.value }))} />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Title Alignment</Label>
                          <div className="flex gap-1">
                            {(['left', 'center', 'right'] as const).map((align) => (
                              <button
                                key={align}
                                onClick={() => setFormStyle((s) => ({ ...s, headingAlignment: align }))}
                                className={`flex-1 py-1.5 rounded text-xs font-medium transition-all ${
                                  formStyle.headingAlignment === align
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

                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Subtitle</Label>
                          <Input
                            value={formStyle.subHeadingText || ""}
                            onChange={(e) => setFormStyle((s) => ({ ...s, subHeadingText: e.target.value }))}
                            className="h-8 text-xs"
                            placeholder="Enter subtitle text"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Subtitle Alignment</Label>
                          <div className="flex gap-1">
                            {(['left', 'center', 'right'] as const).map((align) => (
                              <button
                                key={align}
                                onClick={() => setFormStyle((s) => ({ ...s, subHeadingAlignment: align }))}
                                className={`flex-1 py-1.5 rounded text-xs font-medium transition-all ${
                                  formStyle.subHeadingAlignment === align
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
                      </div>
    </>
  );
}
