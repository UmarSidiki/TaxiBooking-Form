"use client";

import { AdminDriverCard } from "@/features/drivers/ui/admin-driver-card";
import { AdminDriverForm } from "@/features/drivers/ui/admin-driver-form";
import { useAdminDrivers } from "@/features/drivers/hooks/useAdminDrivers";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { DeskConfirmDialog } from "@/features/dashboard/ui/desk-confirm-dialog";
import { Loader2, Plus, Users } from "lucide-react";

export function AdminDriversPage() {
  const drivers = useAdminDrivers();
  const { t, notice, setNotice } = drivers;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t("Driver.driver-management")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("Driver.manage-your-drivers-and-their-accounts")}
          </p>
        </div>
        <Dialog open={drivers.showForm} onOpenChange={drivers.setShowForm}>
          <DialogTrigger asChild>
            <Button className="h-11">
              <Plus className="size-4" />
              {t("Driver.add-driver")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {drivers.editingId
                  ? t("Driver.edit-driver")
                  : t("Driver.add-new-driver")}
              </DialogTitle>
            </DialogHeader>
            <AdminDriverForm
              formData={drivers.formData}
              setFormData={drivers.setFormData}
              onSubmit={drivers.handleSubmit}
              onCancel={drivers.resetForm}
              isLoading={drivers.isLoading}
              editingId={drivers.editingId}
            />
          </DialogContent>
        </Dialog>
      </div>

      {notice ? (
        <p className="rounded-md border border-border bg-card px-4 py-3 text-sm" role="status">
          {notice}
          <button
            type="button"
            className="ms-3 text-primary underline-offset-4 hover:underline"
            onClick={() => setNotice(null)}
          >
            {t("Dashboard.Rides.Dismiss")}
          </button>
        </p>
      ) : null}

      {drivers.isLoading ? (
        <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
          <Loader2 className="me-2 size-5 animate-spin" />
          {t("Driver.loading")}
        </div>
      ) : drivers.drivers.length === 0 ? (
        <Card className="desk-card border-dashed">
          <CardContent className="p-10 text-center">
            <Users className="mx-auto size-10 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">
              {t("Driver.no-drivers-yet")}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("Driver.get-started-by-adding-your-first-driver")}
            </p>
            <Button className="mt-4 h-11" onClick={() => drivers.setShowForm(true)}>
              <Plus className="size-4" />
              {t("Driver.add-your-first-driver")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {drivers.drivers.map((driver) => (
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
