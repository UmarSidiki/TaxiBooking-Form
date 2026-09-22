"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/shared/ui/badge";
import { FIELD_REGISTRY } from "@/features/form-builder/ui/field-registry";
import type { IFormField } from "@/features/form-builder/model";
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
      className={`group relative flex items-center gap-2 rounded-md border p-2 transition-colors duration-150 ${
        isDragging
          ? "border-primary bg-primary/5 opacity-50"
          : !field.enabled
            ? "opacity-50 border-dashed border-border bg-muted/30"
            : isSelected
              ? "border-primary bg-primary/5 ring-1 ring-primary/20"
              : "border-border bg-card hover:border-primary/40"
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="flex size-8 shrink-0 cursor-grab items-center justify-center rounded-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 active:cursor-grabbing"
        aria-label={t("ui.drag_to_reorder")}
      >
        <GripVertical className="size-4 text-muted-foreground" aria-hidden="true" />
      </button>
      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-2 rounded-sm text-start focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        onClick={onSelect}
      >
        <span className="shrink-0 rounded-md bg-primary/10 p-1.5">
          <Icon className="size-3.5 text-primary" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-xs font-medium">{field.label || (reg ? t(reg.labelKey) : "")}</p>
            {reg?.locked ? <Lock className="size-2.5 text-muted-foreground/50" aria-hidden="true" /> : null}
          </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {field.visibleWhen?.bookingType && (
            <Badge variant="outline" className="h-4 px-1 py-0 text-xs">
              {field.visibleWhen.bookingType}
            </Badge>
          )}
          {field.visibleWhen?.tripType && (
            <Badge variant="outline" className="h-4 px-1 py-0 text-xs">
              {t("ui.round_trip")}
            </Badge>
          )}
          <Badge variant="outline" className="h-4 px-1 py-0 text-xs">
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
      </button>
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="flex size-8 shrink-0 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          aria-label={field.enabled ? t("ui.hide_in_preview") : t("ui.show_in_preview")}
        >
          {field.enabled ? (
            <Eye className="h-3.5 w-3.5" />
          ) : (
            <EyeOff className="h-3.5 w-3.5" />
          )}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="flex size-8 shrink-0 items-center justify-center rounded-sm text-muted-foreground opacity-100 transition-[opacity,color,background-color] hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
          aria-label={t("ui.remove_from_form")}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
