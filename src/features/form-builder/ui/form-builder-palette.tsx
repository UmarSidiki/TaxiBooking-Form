"use client";

import { SortableField } from "@/components/form-builder/builder-sortable-field";
import { FIELD_REGISTRY } from "@/components/form-builder/field-registry";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { useFormBuilder } from "@/hooks/form-builder/useFormBuilder";
import type { BookingFieldType } from "@/models/form-layout";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Layers, Plus } from "lucide-react";

type Builder = ReturnType<typeof useFormBuilder>;

export function FormBuilderPalette({
  t,
  fields,
  selectedFieldId,
  setSelectedFieldId,
  addField,
  toggleField,
  removeField,
}: Pick<
  Builder,
  | "t"
  | "fields"
  | "selectedFieldId"
  | "setSelectedFieldId"
  | "addField"
  | "toggleField"
  | "removeField"
>) {
  return (
          <>
          {/* ── Left Sidebar ── */}
          <div className="lg:col-span-3">
            <Card className="border border-border bg-card overflow-hidden sticky top-6 h-[calc(100vh-140px)] flex flex-col">
              <CardHeader className="p-0 shrink-0">
                <div className="px-4 pt-4 pb-3 border-b border-border/50 bg-gradient-to-r from-primary/5 to-primary/10">
                  <CardTitle className="text-base">{t("form_elements")}</CardTitle>
                  <CardDescription className="text-xs mt-0.5">{t("click_to_add")}</CardDescription>
                </div>
              </CardHeader>
              
              <div className="flex-1 overflow-y-auto p-3 space-y-5">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">
                    {t("available_fields")}
                  </Label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(Object.keys(FIELD_REGISTRY) as BookingFieldType[])
                      .filter((type) => !fields.some((f) => f.type === type))
                      .map((type) => {
                        const reg = FIELD_REGISTRY[type];
                        const Icon = reg.icon;
                        const isImportant = ["pickup", "dropoff", "date", "time"].includes(type);
                        return (
                          <Button
                            key={type}
                            variant="outline"
                            size="sm"
                            className={`justify-start gap-2 h-9 px-2 text-[11px] transition-all group ${
                              isImportant 
                                ? "border-amber-200 bg-amber-50/50 hover:border-amber-400 hover:bg-amber-50" 
                                : "hover:border-primary/50 hover:bg-primary/5"
                            }`}
                            onClick={() => addField(type)}
                          >
                            <Icon className={`h-3.5 w-3.5 shrink-0 group-hover:scale-110 transition-transform ${isImportant ? "text-amber-600" : "text-primary"}`} />
                            <span className={`truncate ${isImportant ? "font-semibold text-amber-900" : ""}`}>
                              {t(reg.labelKey)}
                            </span>
                          </Button>
                        );
                      })}
                  </div>
                  {(Object.keys(FIELD_REGISTRY) as BookingFieldType[]).filter((type) => !fields.some((f) => f.type === type)).length === 0 && (
                    <div className="text-[10px] text-muted-foreground text-center py-2 px-3 border border-dashed rounded-md bg-muted/20">
                      {t("all_fields_added")}
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1 flex items-center gap-2">
                    <Layers className="h-3 w-3" /> {t("canvas_title")}
                  </Label>
                  {fields.length === 0 ? (
                    <div className="text-center py-12 px-4 border-2 border-dashed rounded-lg bg-muted/10">
                      <Plus className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground font-medium">{t("empty_form")}</p>
                    </div>
                  ) : (
                    <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-1.5">
                        {fields.map((field) => (
                          <SortableField
                            key={field.id}
                            field={field}
                            isSelected={selectedFieldId === field.id}
                            onSelect={() => setSelectedFieldId(field.id)}
                            onToggle={() => toggleField(field.id)}
                            onRemove={() => removeField(field.id)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  )}
                </div>
              </div>
            </Card>
          </div>
          </>
  );
}
