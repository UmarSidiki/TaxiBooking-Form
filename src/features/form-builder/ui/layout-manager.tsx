"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { IFormLayout } from "@/models/form-layout";
import { Copy, LayoutTemplate, Plus, Star, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

export function LayoutManager({ layouts, currentId, onSelect, onDuplicate, onDelete, onSetDefault, onCreateNew, isLoading }: any) {
  const t = useTranslations("FormBuilder");
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t("ui.layouts_count", { count: layouts.length })}
        </p>
        <Button size="sm" onClick={onCreateNew}>
          <Plus className="h-4 w-4 mr-1" /> {t("ui.new")}
        </Button>
      </div>
      {layouts.length === 0 ? (
        <div className="text-center py-8">
          <div className="rounded-full bg-muted p-4 mx-auto w-fit mb-3">
            <LayoutTemplate className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            {t("ui.no_layouts_created")}
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {layouts.map((layout: any) => (
            <div
              key={layout._id}
              className={`flex items-center gap-3 rounded-lg border p-3 transition-all cursor-pointer ${
                currentId === layout._id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40"
              }`}
              onClick={() => onSelect(layout)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{layout.name}</p>
                  {layout.isDefault && (
                    <Badge className="text-[10px] px-1.5 py-0 h-4">
                      {t("ui.default")}
                    </Badge>
                  )}
                  {!layout.isActive && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 h-4 text-muted-foreground"
                    >
                      {t("ui.inactive")}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("ui.fields_enabled_count", {
                    enabled: layout.fields.filter((f: any) => f.enabled).length,
                    total: layout.fields.length
                  })}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {!layout.isDefault && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSetDefault(layout._id!);
                    }}
                    className="p-1.5 rounded hover:bg-muted"
                    title={t("ui.set_as_default")}
                  >
                    <Star className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate(layout._id!);
                  }}
                  className="p-1.5 rounded hover:bg-muted"
                  title={t("ui.duplicate")}
                  disabled={isLoading}
                >
                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(t("ui.confirm_delete_layout"))) onDelete(layout._id!);
                  }}
                  className="p-1.5 rounded hover:bg-destructive/10"
                  title={t("ui.delete")}
                  disabled={isLoading}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
