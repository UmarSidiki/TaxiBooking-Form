"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { FIELD_REGISTRY } from "@/components/form-builder/field-registry";
import type { IFormField } from "@/models/form-layout";
import { Eye, EyeOff, GripVertical, Lock, MapPin, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

export function SortableField({
  field,
  isSelected,
  onSelect,
  onToggle,
  onRemove,
}: {
  field: IFormField;
  isSelected: boolean;
  onSelect: () => void;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const t = useTranslations("FormBuilder");
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const reg = FIELD_REGISTRY[field.type];
  const Icon = reg?.icon || MapPin;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex items-center gap-2.5 rounded-lg border-2 p-2.5 transition-all duration-150 cursor-pointer ${
        isDragging
          ? "opacity-50 border-primary bg-primary/5 shadow-lg"
          : !field.enabled
            ? "opacity-50 border-dashed border-border bg-muted/30"
            : isSelected
              ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
              : "border-border bg-card hover:border-primary/40 hover:shadow-sm"
      }`}
      onClick={onSelect}
    >
      <button
        {...attributes}
        {...listeners}
        className="flex-shrink-0 cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-muted"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
      <div className="flex-shrink-0 rounded-md bg-primary/10 p-1.5">
        <Icon className="h-3.5 w-3.5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-medium truncate">{field.label || (reg ? t(reg.labelKey) : "")}</p>
          {reg?.locked && (
            <Lock className="h-2.5 w-2.5 text-muted-foreground/50" />
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {field.visibleWhen?.bookingType && (
            <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5">
              {field.visibleWhen.bookingType}
            </Badge>
          )}
          {field.visibleWhen?.tripType && (
            <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5">
              {t("ui.round_trip")}
            </Badge>
          )}
          <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5">
            {field.width === "full"
              ? t("full")
              : field.width === "two-thirds"
                ? "⅔"
                : field.width === "half"
                  ? "½"
                  : field.width === "third"
                    ? "⅓"
                    : "¼"}
          </Badge>
        </div>
      </div>
      <div className="flex items-center gap-0.5">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="flex-shrink-0 p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-primary"
          title={field.enabled ? t("ui.hide_in_preview") : t("ui.show_in_preview")}
        >
          {field.enabled ? (
            <Eye className="h-3.5 w-3.5" />
          ) : (
            <EyeOff className="h-3.5 w-3.5" />
          )}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="flex-shrink-0 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
          title={t("ui.remove_from_form")}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
