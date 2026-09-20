"use client";

import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { LayoutManager } from "@/features/form-builder/ui/layout-manager";
import type { useFormBuilder } from "@/features/form-builder/hooks/useFormBuilder";
import { Check, LayoutTemplate, Loader2, Pencil, Save } from "lucide-react";

type Builder = ReturnType<typeof useFormBuilder>;

export function FormBuilderHeader({
  t,
  layouts,
  currentLayout,
  layoutName,
  setLayoutName,
  isLoading,
  isSaving,
  showManager,
  setShowManager,
  editingName,
  setEditingName,
  lastSaved,
  fields,
  saveLayout,
  selectLayout,
  createNew,
  duplicateLayout,
  deleteLayout,
  setDefaultLayout,
  resetToDefaults,
}: Pick<
  Builder,
  | "t"
  | "layouts"
  | "currentLayout"
  | "layoutName"
  | "setLayoutName"
  | "isLoading"
  | "isSaving"
  | "showManager"
  | "setShowManager"
  | "editingName"
  | "setEditingName"
  | "lastSaved"
  | "fields"
  | "saveLayout"
  | "selectLayout"
  | "createNew"
  | "duplicateLayout"
  | "deleteLayout"
  | "setDefaultLayout"
  | "resetToDefaults"
>) {
  return (
      <>
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div>
            {editingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={layoutName}
                  onChange={(e) => setLayoutName(e.target.value)}
                  placeholder={t("ui.layout_name_placeholder")}
                  className="text-2xl font-bold h-auto py-1 px-2 w-64"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setEditingName(false);
                    if (e.key === "Escape") setEditingName(false);
                  }}
                />
                <Button size="sm" variant="ghost" onClick={() => setEditingName(false)}>
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                className="flex items-center gap-2 text-start"
                onClick={() => setEditingName(true)}
              >
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  {layoutName || t("ui.untitled_layout")}
                </h1>
                <Pencil className="size-4 text-muted-foreground" />
              </button>
            )}
            <div className="flex items-center gap-3 mt-1">
              <p className="text-muted-foreground text-sm">
                {t("ui.fields_enabled", { enabled: fields.filter((f) => f.enabled).length, total: fields.length })}
              </p>
              {lastSaved && (
                <span className="text-xs text-muted-foreground">
                  {t("ui.saved_at", { time: lastSaved.toLocaleTimeString() })}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={resetToDefaults}>
            {t("reset")}
          </Button>
          <Dialog open={showManager} onOpenChange={setShowManager}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <LayoutTemplate className="h-4 w-4 mr-2" />
                {t("layouts")}
                {layouts.length > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs h-5">{layouts.length}</Badge>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{t("layout_manager")}</DialogTitle>
              </DialogHeader>
              <LayoutManager
                layouts={layouts}
                currentId={currentLayout?._id ?? undefined}
                onSelect={selectLayout}
                onDuplicate={duplicateLayout}
                onDelete={deleteLayout}
                onSetDefault={setDefaultLayout}
                onCreateNew={createNew}
                isLoading={isLoading}
              />
            </DialogContent>
          </Dialog>
          <Button onClick={saveLayout} disabled={isSaving || !layoutName.trim()} size="sm">
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {t("save_layout")}
          </Button>
        </div>
      </div>
      </>
  );
}
