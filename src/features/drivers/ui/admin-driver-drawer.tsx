"use client";

import type { FormEvent } from "react";
import { useTranslations } from "next-intl";
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col overflow-hidden p-0 sm:max-w-md [&>button]:hidden"
      >
        <SheetHeader className="flex-none border-b border-border/60 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <SheetTitle className="truncate text-sm font-semibold text-foreground sm:text-base">
                {editingId
                  ? t("Driver.edit-driver")
                  : t("Driver.add-new-driver")}
              </SheetTitle>
              {editingId ? (
                <p className="mt-0.5 truncate text-xs font-medium text-muted-foreground">
                  {formData.name}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
            <AdminDriverFormFields
              formData={formData}
              setFormData={setFormData}
              editingId={editingId}
            />
          </div>

          <div className="flex-none border-t border-border/60 bg-card/50 px-4 py-3 sm:px-6 sm:py-4">
            <div className="mb-3 flex items-center justify-between sm:mb-4">
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
                className="h-11 w-full gap-1.5 rounded-xl font-semibold sm:h-10 sm:flex-1"
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
                className="h-11 w-full rounded-xl px-4 sm:h-10 sm:w-auto"
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
