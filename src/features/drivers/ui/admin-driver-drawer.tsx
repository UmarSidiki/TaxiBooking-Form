"use client";

import { useRef, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, Save, X } from "lucide-react";

import type { DriverFormValues } from "@/features/drivers/hooks/useAdminDrivers";
import { AdminDriverFormFields } from "@/features/drivers/ui/admin-driver-form-fields";
import { Button } from "@/shared/ui/button";
import { Switch } from "@/shared/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/shared/ui/sheet";

interface AdminDriverDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: DriverFormValues;
  setFormData: (data: DriverFormValues) => void;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
  isLoading: boolean;
  editingId: string | null;
}

export function AdminDriverDrawer({
  open,
  onOpenChange,
  formData,
  setFormData,
  onSubmit,
  onCancel,
  isLoading,
  editingId,
}: AdminDriverDrawerProps) {
  const t = useTranslations();
  const isRtl = useLocale() === "ar";
  const returnFocusRef = useRef<HTMLElement | null>(null);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isRtl ? "left" : "right"}
        className="riviera-drawer flex h-dvh max-h-dvh flex-col gap-0 overflow-hidden border-0 p-0 [&>button]:hidden"
        onOpenAutoFocus={() => {
          returnFocusRef.current = document.activeElement as HTMLElement | null;
        }}
        onCloseAutoFocus={(event) => {
          const target = returnFocusRef.current;
          if (target && document.contains(target)) {
            event.preventDefault();
            target.focus();
          }
        }}
      >
        <SheetHeader
          data-drawer-header
          className="riviera-drawer__header flex-none border-b border-border/60"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <SheetTitle
                className="truncate text-sm font-semibold text-foreground sm:text-base"
                title={formData.name || undefined}
              >
                {editingId
                  ? t("Driver.edit-driver")
                  : t("Driver.add-new-driver")}
              </SheetTitle>
              {editingId ? (
                <p
                  className="mt-0.5 truncate text-xs font-medium text-muted-foreground"
                  title={formData.name}
                >
                  {formData.name}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={t("Driver.cancel")}
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        </SheetHeader>

        <form
          id="admin-driver-form"
          onSubmit={onSubmit}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div
            data-drawer-body
            className="riviera-drawer__body min-h-0 flex-1"
          >
            <AdminDriverFormFields
              formData={formData}
              setFormData={setFormData}
              editingId={editingId}
            />
          </div>

          <div
            data-drawer-footer
            className="riviera-drawer__footer flex-none border-t border-border/60"
          >
            <div className="mb-3 flex min-h-11 items-center justify-between gap-3 sm:mb-4">
              <label
                htmlFor="driver-isActive"
                className="cursor-pointer text-sm font-medium text-foreground"
              >
                {t("Driver.active")}
              </label>
              <Switch
                id="driver-isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked })
                }
              />
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-2.5">
              <Button
                type="submit"
                form="admin-driver-form"
                disabled={isLoading}
                className="h-11 w-full gap-1.5 rounded font-semibold sm:flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    {t("Dashboard.Settings.saving")}
                  </>
                ) : (
                  <>
                    <Save className="size-4" aria-hidden="true" />
                    {editingId
                      ? t("Driver.update-driver")
                      : t("Driver.add-driver")}
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="h-11 w-full rounded px-4 sm:w-auto"
              >
                {t("Driver.cancel")}
              </Button>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
