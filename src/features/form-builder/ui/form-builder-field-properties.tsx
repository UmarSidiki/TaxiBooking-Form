"use client";

import { FIELD_REGISTRY } from "@/features/form-builder/ui/field-registry";
import { Badge } from "@/shared/ui/badge";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Separator } from "@/shared/ui/separator";
import { Switch } from "@/shared/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import type { IFormField } from "@/features/form-builder/model";
import { Clock, Eye, MapPin, Monitor, Smartphone } from "lucide-react";
import type { useTranslations } from "next-intl";

export function FormBuilderFieldProperties({
  t,
  selectedField,
  updateField,
  toggleField,
}: {
  t: ReturnType<typeof useTranslations<"FormBuilder">>;
  selectedField: IFormField;
  updateField: (id: string, updates: Partial<IFormField>) => void;
  toggleField: (id: string) => void;
}) {
  return (
                        <div className="space-y-5">
                          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border/50">
                            {(() => {
                              const reg = FIELD_REGISTRY[selectedField.type];
                              const Icon = reg?.icon || MapPin;
                              return (
                                <>
                                  <div className="rounded-md bg-primary/10 p-2.5">
                                    <Icon className="h-5 w-5 text-primary" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold">{t(reg.labelKey)}</p>
                                    <p className="text-[11px] text-muted-foreground">{t(reg.descriptionKey)}</p>
                                  </div>
                                </>
                              );
                            })()}
                          </div>

                          <div className="space-y-3">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Content</Label>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium">{t("header_text")}</Label>
                              <Input
                                value={selectedField.label}
                                onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                                className="h-8 text-sm"
                              />
                            </div>
                            {!["booking-type", "trip-type", "stops"].includes(selectedField.type) && (
                              <div className="space-y-1.5">
                                <Label className="text-xs font-medium">{t("placeholder")}</Label>
                                <Input
                                  value={selectedField.placeholder || ""}
                                  onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
                                  className="h-8 text-sm"
                                />
                              </div>
                            )}
                          </div>

                          <Separator />

                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
                              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Desktop Layout</Label>
                            </div>
                            
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium">Grid Width</Label>
                              <Select
                                value={selectedField.width}
                                onValueChange={(v) => updateField(selectedField.id, { width: v as IFormField["width"] })}
                              >
                                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="full">Full Width (100%)</SelectItem>
                                  <SelectItem value="two-thirds">Two-Thirds (66%)</SelectItem>
                                  <SelectItem value="half">Half (50%)</SelectItem>
                                  <SelectItem value="third">Third (33%)</SelectItem>
                                  <SelectItem value="quarter">Quarter (25%)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {!selectedField.visibleWhen?.bookingType && (
                              <div className="space-y-1.5">
                                <Label className="text-xs font-medium flex items-center gap-1.5">
                                  <Clock className="h-3 w-3" /> Hourly Mode Width
                                  <span className="text-[9px] text-muted-foreground font-normal ml-auto">Optional</span>
                                </Label>
                                <Select
                                  value={selectedField.widthWhenHourly || "inherit"}
                                  onValueChange={(v) => updateField(selectedField.id, { widthWhenHourly: v === "inherit" ? undefined : (v as IFormField["width"]) })}
                                >
                                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="inherit">Same as Default</SelectItem>
                                    <SelectItem value="full">Full Width</SelectItem>
                                    <SelectItem value="two-thirds">Two-Thirds</SelectItem>
                                    <SelectItem value="half">Half</SelectItem>
                                    <SelectItem value="third">Third</SelectItem>
                                    <SelectItem value="quarter">Quarter</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>

                          <Separator />

                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
                              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mobile Layout</Label>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium">Mobile Width Override</Label>
                              <p className="text-[10px] text-muted-foreground">How this field behaves on small screens.</p>
                              <Select
                                value={selectedField.mobileWidth || "inherit"}
                                onValueChange={(v) => updateField(selectedField.id, { mobileWidth: v === "inherit" ? undefined : (v as IFormField["width"]) })}
                              >
                                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="inherit">Same as Desktop</SelectItem>
                                  <SelectItem value="full">Full Width</SelectItem>
                                  <SelectItem value="two-thirds">Two-Thirds</SelectItem>
                                  <SelectItem value="half">Half (Side-by-side)</SelectItem>
                                  <SelectItem value="third">Third</SelectItem>
                                  <SelectItem value="quarter">Quarter</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium flex items-center gap-1.5">
                                <Clock className="h-3 w-3" /> Mobile Hourly Mode Width
                                <span className="text-[9px] text-muted-foreground font-normal ml-auto">Optional</span>
                              </Label>
                              <Select
                                value={selectedField.mobileWidthWhenHourly || "inherit"}
                                onValueChange={(v) => updateField(selectedField.id, { mobileWidthWhenHourly: v === "inherit" ? undefined : (v as IFormField["width"]) })}
                              >
                                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="inherit">Same as Mobile Default</SelectItem>
                                  <SelectItem value="full">Full Width</SelectItem>
                                  <SelectItem value="two-thirds">Two-Thirds</SelectItem>
                                  <SelectItem value="half">Half (Side-by-side)</SelectItem>
                                  <SelectItem value="third">Third</SelectItem>
                                  <SelectItem value="quarter">Quarter</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <Separator />

                          <div className="space-y-3">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Logic & Validation</Label>
                            <div className="flex items-center justify-between">
                              <div>
                                <Label className="text-xs font-medium">{t("required")}</Label>
                                {FIELD_REGISTRY[selectedField.type]?.locked && <p className="text-[10px] text-muted-foreground">Core field</p>}
                              </div>
                              <Switch 
                                checked={selectedField.required} 
                                disabled={FIELD_REGISTRY[selectedField.type]?.locked}
                                onCheckedChange={(c) => updateField(selectedField.id, { required: c })}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <Label className="text-xs font-medium">{t("enabled")}</Label>
                              </div>
                              <Switch 
                                checked={selectedField.enabled} 
                                disabled={FIELD_REGISTRY[selectedField.type]?.locked}
                                onCheckedChange={() => toggleField(selectedField.id)}
                              />
                            </div>
                          </div>

                          {["booking-type", "trip-type"].includes(selectedField.type) && (
                            <div className="space-y-3">
                              <Separator />
                              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Styling</Label>
                              <div className="flex items-center justify-between">
                                <div>
                                  <Label className="text-xs font-medium">Remove Border Container</Label>
                                  <p className="text-[10px] text-muted-foreground">Hide the bordered box around buttons</p>
                                </div>
                                <Switch 
                                  checked={selectedField.showBorder === false}
                                  onCheckedChange={(isRemovingBorder) => {
                                    const newValue = isRemovingBorder ? false : true;
                                    console.log("Toggled showBorder to:", newValue);
                                    updateField(selectedField.id, { showBorder: newValue });
                                  }}
                                />
                              </div>
                            </div>
                          )}

                          {selectedField.visibleWhen && (
                            <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-md space-y-2">
                              <p className="text-[10px] font-semibold text-blue-900 uppercase tracking-wider">Conditional Visibility</p>
                              {selectedField.visibleWhen.bookingType && (
                                <div className="flex items-center gap-2 text-xs text-blue-800">
                                  <Eye className="h-3 w-3" />
                                  <span>Only in <Badge variant="secondary" className="text-[10px] bg-white">{selectedField.visibleWhen.bookingType}</Badge> mode</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
  );
}
