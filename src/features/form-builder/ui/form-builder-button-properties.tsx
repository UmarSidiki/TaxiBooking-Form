"use client";

import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Separator } from "@/shared/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import type { IFormStyle } from "@/features/form-builder/model";
import { ArrowRight } from "lucide-react";
import type { useTranslations } from "next-intl";
import type { Dispatch, SetStateAction } from "react";

export function FormBuilderButtonProperties({
  t,
  formStyle,
  setFormStyle,
}: {
  t: ReturnType<typeof useTranslations<"FormBuilder">>;
  formStyle: IFormStyle;
  setFormStyle: Dispatch<SetStateAction<IFormStyle>>;
}) {
  return (
                        <div className="space-y-5">
                          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border/50">
                            <div className="rounded-md bg-primary/10 p-2.5">
                              <ArrowRight className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold">{t("button_properties.search_button")}</p>
                              <p className="text-xs text-muted-foreground">{t("button_properties.configure_button")}</p>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("button_properties.content")}</Label>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium">{t("button_properties.button_text")}</Label>
                              <Input
                                value={formStyle.buttonText}
                                onChange={(e) => setFormStyle((s) => ({ ...s, buttonText: e.target.value }))}
                                className="h-8 text-sm"
                                placeholder={t("button_properties.button_text")}
                              />
                            </div>
                          </div>

                          <Separator />

                          <div className="space-y-3">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("button_properties.layout")}</Label>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium">{t("button_properties.width")}</Label>
                              <Select
                                value={formStyle.buttonWidth || "full"}
                                onValueChange={(v) => {
                                  if (
                                    v === "full" ||
                                    v === "two-thirds" ||
                                    v === "half" ||
                                    v === "third" ||
                                    v === "quarter"
                                  ) {
                                    setFormStyle((s) => ({ ...s, buttonWidth: v }));
                                  }
                                }}
                              >
                                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="full">{t("button_properties.full_width")}</SelectItem>
                                  <SelectItem value="two-thirds">{t("button_properties.two_thirds")}</SelectItem>
                                  <SelectItem value="half">{t("button_properties.half")}</SelectItem>
                                  <SelectItem value="third">{t("button_properties.third")}</SelectItem>
                                  <SelectItem value="quarter">{t("button_properties.quarter")}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium">{t("button_properties.alignment")}</Label>
                              <div className="flex gap-1">
                                {(['left', 'center', 'right'] as const).map((align) => (
                                  <button
                                    key={align}
                                    onClick={() => setFormStyle((s) => ({ ...s, buttonAlignment: align }))}
                                    className={`flex-1 py-1.5 rounded text-xs font-medium transition-all ${
                                      formStyle.buttonAlignment === align
                                        ? 'bg-primary text-white'
                                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                    }`}
                                    title={t(`button_properties.${align}`)}
                                  >
                                    {align === 'left' ? '←' : align === 'center' ? '↔' : '→'}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium">{t("button_properties.size")}</Label>
                              <Select
                                value={formStyle.buttonSize || "default"}
                                onValueChange={(v) => {
                                  if (v === "small" || v === "default" || v === "large") {
                                    setFormStyle((s) => ({ ...s, buttonSize: v }));
                                  }
                                }}
                              >
                                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="small">{t("button_properties.small")}</SelectItem>
                                  <SelectItem value="default">{t("button_properties.default")}</SelectItem>
                                  <SelectItem value="large">{t("button_properties.large")}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <Separator />

                          <div className="space-y-3">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("button_properties.styling")}</Label>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium">{t("button_properties.background_color")}</Label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={formStyle.buttonColor}
                                  onChange={(e) => setFormStyle((s) => ({ ...s, buttonColor: e.target.value }))}
                                  className="h-8 w-8 rounded cursor-pointer border-0 p-0"
                                />
                                <Input className="h-8 text-xs font-mono flex-1" value={formStyle.buttonColor} onChange={(e) => setFormStyle((s) => ({ ...s, buttonColor: e.target.value }))} />
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium">{t("button_properties.text_color")}</Label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={formStyle.buttonTextColor}
                                  onChange={(e) => setFormStyle((s) => ({ ...s, buttonTextColor: e.target.value }))}
                                  className="h-8 w-8 rounded cursor-pointer border-0 p-0"
                                />
                                <Input className="h-8 text-xs font-mono flex-1" value={formStyle.buttonTextColor} onChange={(e) => setFormStyle((s) => ({ ...s, buttonTextColor: e.target.value }))} />
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium">{t("button_properties.border_radius")}</Label>
                              <Input
                                value={formStyle.buttonBorderRadius || "0.5rem"}
                                onChange={(e) => setFormStyle((s) => ({ ...s, buttonBorderRadius: e.target.value }))}
                                className="h-8 text-xs font-mono"
                                placeholder="0.5rem"
                              />
                            </div>
                          </div>
                        </div>
  );
}
