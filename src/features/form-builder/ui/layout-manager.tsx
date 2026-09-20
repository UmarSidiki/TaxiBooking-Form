"use client";

import { useState } from "react";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import type { IFormLayout } from "@/features/form-builder/model";
import { DeskConfirmDialog } from "@/features/dashboard/ui/desk-confirm-dialog";
import { Copy, LayoutTemplate, Plus, Star, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

export function LayoutManager({
  layouts,
  currentId,
  onSelect,
  onDuplicate,
  onDelete,
  onSetDefault,
  onCreateNew,
  isLoading,
}: {
  layouts: IFormLayout[];
  currentId?: string;
  onSelect: (layout: IFormLayout) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
  onCreateNew: () => void;
  isLoading?: boolean;
}) {
  const t = useTranslations("FormBuilder");
  const rides = useTranslations("Dashboard.Rides");
  const [pendingId, setPendingId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t("ui.layouts_count", { count: layouts.length })}
        </p>
        <Button size="sm" onClick={onCreateNew}>
          <Plus className="size-4 me-1" /> {t("ui.new")}
        </Button>
      </div>
      {layouts.length === 0 ? (
        <div className="py-8 text-center">
          <div className="mx-auto mb-3 w-fit rounded-full bg-muted p-4">
            <LayoutTemplate className="size-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">{t("ui.no_layouts_created")}</p>
        </div>
      ) : (
        <div className="max-h-80 space-y-2 overflow-y-auto">
          {layouts.map((layout) => (
            <div
              key={layout._id}
              className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 ${
                currentId === layout._id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40"
              }`}
              onClick={() => onSelect(layout)}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium">{layout.name}</p>
                  {layout.isDefault ? (
                    <Badge className="h-5 px-1.5 text-xs">{t("ui.default")}</Badge>
                  ) : null}
                  {!layout.isActive ? (
                    <Badge variant="outline" className="h-5 px-1.5 text-xs text-muted-foreground">
                      {t("ui.inactive")}
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t("ui.fields_enabled_count", {
                    enabled: layout.fields.filter((field) => field.enabled).length,
                    total: layout.fields.length,
                  })}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {!layout.isDefault ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSetDefault(layout._id!);
                    }}
                    className="min-h-11 min-w-11 rounded-md hover:bg-muted"
                    title={t("ui.set_as_default")}
                  >
                    <Star className="mx-auto size-4 text-muted-foreground" />
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDuplicate(layout._id!);
                  }}
                  className="min-h-11 min-w-11 rounded-md hover:bg-muted"
                  title={t("ui.duplicate")}
                  disabled={isLoading}
                >
                  <Copy className="mx-auto size-4 text-muted-foreground" />
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setPendingId(layout._id!);
                  }}
                  className="min-h-11 min-w-11 rounded-md hover:bg-destructive/10"
                  title={t("ui.delete")}
                  disabled={isLoading}
                >
                  <Trash2 className="mx-auto size-4 text-destructive" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <DeskConfirmDialog
        open={Boolean(pendingId)}
        title={t("ui.delete")}
        description={t("ui.confirm_delete_layout")}
        confirmLabel={t("ui.delete")}
        cancelLabel={rides("cancel")}
        pending={isLoading}
        onConfirm={() => {
          if (pendingId) onDelete(pendingId);
          setPendingId(null);
        }}
        onOpenChange={(open) => {
          if (!open) setPendingId(null);
        }}
      />
    </div>
  );
}
