"use client";

import { AdminDriverCard } from "@/features/drivers/ui/admin-driver-card";
import { AdminDriverDrawer } from "@/features/drivers/ui/admin-driver-drawer";
import { useAdminDrivers } from "@/features/drivers/hooks/useAdminDrivers";
import { DeskConfirmDialog } from "@/features/dashboard/ui/desk-confirm-dialog";
import { DeskNotice } from "@/features/dashboard/ui/desk-notice";
import { DeskPageMeta } from "@/features/dashboard/ui/desk-page-chrome";
import {
  DeskFilterBar,
  DeskToolbar,
  deskSearchInputClassName,
} from "@/features/dashboard/ui/desk-toolbar";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Plus, Search, Users } from "lucide-react";
import { useMemo, useState } from "react";

export function AdminDriversPage() {
  const drivers = useAdminDrivers();
  const { t, notice, setNotice } = drivers;
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return drivers.drivers;
    return drivers.drivers.filter((driver) => {
      const haystack = `${driver.name} ${driver.email}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [drivers.drivers, searchQuery]);

  return (
    <div className="flex flex-col gap-5">
      <DeskPageMeta
        title={t("Driver.driver-management")}
        description={
          drivers.drivers.length > 0
            ? `${t("Driver.manage-your-drivers-and-their-accounts")} · ${drivers.drivers.length}`
            : t("Driver.manage-your-drivers-and-their-accounts")
        }
      />

      <DeskToolbar>
        <DeskFilterBar>
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              name="driver-search"
              type="search"
              autoComplete="off"
              aria-label={t("Driver.search-drivers")}
              placeholder={t("Driver.search-drivers")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={deskSearchInputClassName}
            />
          </div>
          {searchQuery ? (
            <span
              className="shrink-0 text-xs tabular-nums text-muted-foreground"
              aria-live="polite"
            >
              {filtered.length} / {drivers.drivers.length}
            </span>
          ) : null}
        </DeskFilterBar>

        <Button
          className="h-10 w-full shrink-0 rounded-xl px-4 font-semibold xl:w-auto"
          onClick={drivers.openCreateForm}
        >
          <Plus className="size-4" aria-hidden="true" />
          {t("Driver.add-driver")}
        </Button>
      </DeskToolbar>

      <AdminDriverDrawer
        open={drivers.showForm}
        onOpenChange={(open) => {
          if (!open) drivers.resetForm();
          else drivers.setShowForm(true);
        }}
        formData={drivers.formData}
        setFormData={drivers.setFormData}
        onSubmit={drivers.handleSubmit}
        onCancel={drivers.resetForm}
        isLoading={drivers.isLoading}
        editingId={drivers.editingId}
      />

      {notice ? (
        <DeskNotice
          onDismiss={() => setNotice(null)}
          dismissLabel={t("Dashboard.Rides.Dismiss")}
        >
          {notice}
        </DeskNotice>
      ) : null}

      {drivers.loadError ? (
        <DeskNotice
          variant="error"
          onRetry={() => void drivers.fetchDrivers()}
          retryLabel={t("Dashboard.Home.try-again")}
        >
          {drivers.loadError}
        </DeskNotice>
      ) : null}

      {drivers.isLoading ? (
        <div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
          role="status"
        >
          <span className="sr-only">{t("Driver.loading")}</span>
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="desk-card h-36 animate-pulse rounded-2xl border border-border/60 bg-card"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="desk-card flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/70 bg-card p-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-muted">
            <Users className="size-6 text-muted-foreground" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">
              {drivers.drivers.length === 0
                ? t("Driver.no-drivers-yet")
                : t("Driver.no-drivers-match")}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {drivers.drivers.length === 0
                ? t("Driver.get-started-by-adding-your-first-driver")
                : t("Driver.try-another-search")}
            </p>
          </div>
          {drivers.drivers.length === 0 ? (
            <Button
              className="mt-1 h-10 rounded-xl"
              onClick={drivers.openCreateForm}
            >
              <Plus className="size-4" aria-hidden="true" />
              {t("Driver.add-your-first-driver")}
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((driver) => (
            <AdminDriverCard
              key={driver._id}
              driver={driver}
              onEdit={drivers.handleEdit}
              onDelete={drivers.handleDelete}
            />
          ))}
        </div>
      )}

      <DeskConfirmDialog
        open={Boolean(drivers.pendingDeleteId)}
        title={t("Driver.are-you-sure-you-want-to-delete-this-driver")}
        description={t("Driver.are-you-sure-you-want-to-delete-this-driver")}
        confirmLabel={t("Driver.delete")}
        cancelLabel={t("Driver.cancel")}
        pending={drivers.isLoading}
        onConfirm={drivers.confirmDelete}
        onOpenChange={(open) => {
          if (!open) drivers.setPendingDeleteId(null);
        }}
      />
    </div>
  );
}
