"use client";

import type { DriverFormValues } from "@/features/drivers/hooks/useAdminDrivers";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Switch } from "@/shared/ui/switch";
import { Loader2, Save } from "lucide-react";
import { useTranslations } from "next-intl";

export function AdminDriverForm({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  isLoading,
  editingId,
}: {
  formData: DriverFormValues;
  setFormData: (data: DriverFormValues) => void;
  onSubmit: (event: React.FormEvent) => void;
  onCancel: () => void;
  isLoading: boolean;
  editingId: string | null;
}) {
  const t = useTranslations();

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="driver-name">{t("Driver.name")}</Label>
        <Input
          id="driver-name"
          required
          className="h-11"
          placeholder={t("Driver.driver-name")}
          value={formData.name}
          onChange={(event) =>
            setFormData({ ...formData, name: event.target.value })
          }
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="driver-email">{t("Driver.email")}</Label>
        <Input
          id="driver-email"
          required
          type="email"
          className="h-11"
          autoComplete="email"
          value={formData.email}
          onChange={(event) =>
            setFormData({ ...formData, email: event.target.value })
          }
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="driver-password">{t("Driver.password")}</Label>
        <Input
          id="driver-password"
          required={!editingId}
          type="password"
          className="h-11"
          autoComplete="new-password"
          value={formData.password}
          onChange={(event) =>
            setFormData({ ...formData, password: event.target.value })
          }
        />
        {editingId ? (
          <p className="text-xs text-muted-foreground">
            {t("Driver.leave-empty-to-keep-current-password")}
          </p>
        ) : null}
      </div>
      <div className="flex min-h-11 items-center gap-3">
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, isActive: checked })
          }
        />
        <Label htmlFor="isActive">{t("Driver.active")}</Label>
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isLoading} className="h-11 flex-1">
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {t("Dashboard.Settings.saving")}
            </>
          ) : (
            <>
              <Save className="size-4" />
              {editingId ? t("Driver.update-driver") : t("Driver.add-driver")}
            </>
          )}
        </Button>
        <Button type="button" variant="outline" className="h-11" onClick={onCancel}>
          {t("Driver.cancel")}
        </Button>
      </div>
    </form>
  );
}
