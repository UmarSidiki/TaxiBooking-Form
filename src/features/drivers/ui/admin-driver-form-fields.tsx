"use client";

import type { DriverFormValues } from "@/features/drivers/hooks/useAdminDrivers";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { useTranslations } from "next-intl";

export function AdminDriverFormFields({
  formData,
  setFormData,
  editingId,
}: {
  formData: DriverFormValues;
  setFormData: (data: DriverFormValues) => void;
  editingId: string | null;
}) {
  const t = useTranslations();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="driver-name">{t("Driver.name")}</Label>
        <Input
          id="driver-name"
          name="driver-name"
          autoComplete="name"
          required
          className="h-11"
          placeholder={t("Driver.driver-name")}
          value={formData.name}
          onChange={(event) =>
            setFormData({ ...formData, name: event.target.value })
          }
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="driver-email">{t("Driver.email")}</Label>
        <Input
          id="driver-email"
          name="driver-email"
          required
          type="email"
          className="h-11"
          autoComplete="email"
          spellCheck={false}
          value={formData.email}
          onChange={(event) =>
            setFormData({ ...formData, email: event.target.value })
          }
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="driver-password">{t("Driver.password")}</Label>
        <Input
          id="driver-password"
          name="driver-password"
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
    </div>
  );
}
