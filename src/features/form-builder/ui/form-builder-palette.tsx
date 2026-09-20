"use client";

import { SortableField } from "@/features/form-builder/ui/builder-sortable-field";
import { FIELD_REGISTRY } from "@/features/form-builder/ui/field-registry";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Label } from "@/shared/ui/label";
import { Separator } from "@/shared/ui/separator";
import type { useFormBuilder } from "@/features/form-builder/hooks/useFormBuilder";
import type { BookingFieldType } from "@/features/form-builder/model";
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
  const unused = (Object.keys(FIELD_REGISTRY) as BookingFieldType[]).filter(
    (type) => !fields.some((field) => field.type === type)
  );

  return (
    <div className="lg:col-span-3">
      <Card className="sticky top-6 flex h-[calc(100vh-140px)] flex-col overflow-hidden border-border">
        <CardHeader className="shrink-0 border-b border-border p-4">
          <CardTitle className="text-base">{t("form_elements")}</CardTitle>
          <CardDescription className="text-xs">{t("click_to_add")}</CardDescription>
        </CardHeader>
        <div className="flex-1 space-y-5 overflow-y-auto p-3">
          <div className="space-y-2">
            <Label className="px-1 text-xs font-medium text-muted-foreground">
              {t("available_fields")}
            </Label>
            <div className="grid grid-cols-2 gap-1.5">
              {unused.map((type) => {
                const reg = FIELD_REGISTRY[type];
                const Icon = reg.icon;
                return (
                  <Button
                    key={type}
                    variant="outline"
                    size="sm"
                    className="h-11 justify-start gap-2 px-2 text-xs hover:bg-accent"
                    onClick={() => addField(type)}
                  >
                    <Icon className="size-3.5 shrink-0 text-primary" />
                    <span className="truncate">{t(reg.labelKey)}</span>
                  </Button>
                );
              })}
            </div>
            {unused.length === 0 ? (
              <p className="rounded-md border border-dashed border-border py-2 text-center text-xs text-muted-foreground">
                {t("all_fields_added")}
              </p>
            ) : null}
          </div>
          <Separator />
          <div className="space-y-2">
            <Label className="flex items-center gap-2 px-1 text-xs font-medium text-muted-foreground">
              <Layers className="size-3" /> {t("canvas_title")}
            </Label>
            {fields.length === 0 ? (
              <div className="rounded-md border border-dashed border-border px-4 py-10 text-center">
                <Plus className="mx-auto mb-2 size-6 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{t("empty_form")}</p>
              </div>
            ) : (
              <SortableContext
                items={fields.map((field) => field.id)}
                strategy={verticalListSortingStrategy}
              >
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
  );
}
