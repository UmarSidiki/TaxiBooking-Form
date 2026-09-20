"use client";

import { FIELD_REGISTRY } from "@/components/form-builder/field-registry";
import type { IFormField } from "@/models/form-layout";
import { GripVertical, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";

export function FieldPreview({ field }: { field: IFormField }) {
  const t = useTranslations("FormBuilder");
  const reg = FIELD_REGISTRY[field.type];
  const Icon = reg?.icon || MapPin;

  return (
    <div className="flex items-center gap-3 rounded-lg border-2 border-primary bg-card p-3 shadow-xl rotate-2 scale-105">
      <GripVertical className="h-4 w-4 text-muted-foreground" />
      <div className="rounded-md bg-primary/10 p-2">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p className="text-sm font-medium">{field.label || (reg ? t(reg.labelKey) : "")}</p>
    </div>
  );
}
