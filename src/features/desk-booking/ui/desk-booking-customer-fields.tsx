"use client";

import type { useTranslations } from "next-intl";

import type { DeskBookingFormValues } from "@/features/desk-booking/hooks/use-desk-booking-form";
import { deskControlClassName } from "@/features/dashboard/ui/desk-toolbar";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Switch } from "@/shared/ui/switch";
import { Textarea } from "@/shared/ui/textarea";
import { routing } from "@/shared/i18n/routing";

type TFn = ReturnType<typeof useTranslations>;

export function DeskBookingCustomerFields({
  t,
  formData,
  update,
}: {
  t: TFn;
  formData: DeskBookingFormValues;
  update: (patch: Partial<DeskBookingFormValues>) => void;
}) {
  return (
    <section className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-foreground">
        {t("Dashboard.Rides.customer-information")}
      </h3>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="desk-firstName">{t("Step3.first-name")}</Label>
          <Input
            id="desk-firstName"
            value={formData.firstName}
            onChange={(event) => update({ firstName: event.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="desk-lastName">{t("Step3.last-name")}</Label>
          <Input
            id="desk-lastName"
            value={formData.lastName}
            onChange={(event) => update({ lastName: event.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="desk-email">{t("Step3.email-address")}</Label>
          <Input
            id="desk-email"
            type="email"
            autoComplete="off"
            value={formData.email}
            onChange={(event) => update({ email: event.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="desk-phone">{t("Step3.phone-number")}</Label>
          <Input
            id="desk-phone"
            type="tel"
            autoComplete="off"
            value={formData.phone}
            onChange={(event) => update({ phone: event.target.value })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="desk-locale">
          {t("Dashboard.Rides.customer-language")}
        </Label>
        <Select
          value={formData.locale}
          onValueChange={(value) => update({ locale: value })}
        >
          <SelectTrigger id="desk-locale" className={deskControlClassName}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {routing.locales.map((locale) => (
              <SelectItem key={locale} value={locale}>
                {locale}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <label
          htmlFor="desk-whatsapp"
          className="cursor-pointer text-sm font-medium text-foreground"
        >
          {t("Step3.whatsapp_opt_in")}
        </label>
        <Switch
          id="desk-whatsapp"
          checked={formData.whatsappOptIn}
          onCheckedChange={(checked) => update({ whatsappOptIn: checked })}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="desk-childSeats">{t("Step3.child-seats")}</Label>
          <Input
            id="desk-childSeats"
            type="number"
            min={0}
            value={formData.childSeats}
            onChange={(event) =>
              update({ childSeats: Number(event.target.value) || 0 })
            }
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="desk-babySeats">{t("Step3.baby-seats")}</Label>
          <Input
            id="desk-babySeats"
            type="number"
            min={0}
            value={formData.babySeats}
            onChange={(event) =>
              update({ babySeats: Number(event.target.value) || 0 })
            }
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="desk-notes">
          {t("Step3.special-requests-optional")}
        </Label>
        <Textarea
          id="desk-notes"
          rows={3}
          value={formData.notes}
          placeholder={t("Step3.any-special-requirements-or-notes")}
          onChange={(event) => update({ notes: event.target.value })}
        />
      </div>
    </section>
  );
}
