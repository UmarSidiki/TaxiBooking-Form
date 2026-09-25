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
import { DeskPageMeta } from "@/features/dashboard/ui/desk-page-chrome";
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
      <DeskPageMeta title={t("title")} description={t("description")} />
      {/* ── Header ── */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div>
            {editingName ? (
              <div className="flex items-center gap-2">
                <Input
                  name="layout-name"
                  aria-label={t("ui.layout_name_placeholder")}
                  value={layoutName}
                  onChange={(e) => setLayoutName(e.target.value)}
                  placeholder={t("ui.layout_name_placeholder")}
                  className="h-11 w-64 px-2 text-base font-semibold"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setEditingName(false);
                    if (e.key === "Escape") setEditingName(false);
                  }}
                />
                <Button size="icon" variant="ghost" onClick={() => setEditingName(false)} aria-label={t("save_layout")}>
                  <Check className="size-4" aria-hidden="true" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                className="flex min-h-11 items-center gap-2 rounded-sm text-start focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                onClick={() => setEditingName(true)}
              >
                <span className="text-base font-semibold tracking-tight text-foreground">
                  {layoutName || t("ui.untitled_layout")}
                </span>
                <Pencil className="size-4 text-muted-foreground" aria-hidden="true" />
              </button>
            )}
            <div className="mt-1 flex items-center gap-3">
              <p className="text-sm text-muted-foreground">
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
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <Button variant="outline" onClick={resetToDefaults} className="min-h-11">
            {t("reset")}
          </Button>
          <Dialog open={showManager} onOpenChange={setShowManager}>
            <DialogTrigger asChild>
              <Button variant="outline" className="min-h-11">
                <LayoutTemplate className="size-4" aria-hidden="true" />
                {t("layouts")}
                {layouts.length > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs h-5">{layouts.length}</Badge>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] w-[calc(100%-2rem)] max-w-md overflow-y-auto overscroll-contain">
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
          <Button onClick={saveLayout} disabled={isSaving || !layoutName.trim()} className="min-h-11">
            {isSaving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
            {t("save_layout")}
          </Button>
        </div>
      </div>
      </>
  );
}
