"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Input } from "@/shared/ui/input";
import { Card } from "@/shared/ui/card";
import { Checkbox } from "@/shared/ui/checkbox";
import { useGeo } from "@/features/geo/context/geo-context";
import type { useStep3 } from "@/features/booking/hooks/form-steps/useStep3";
import { useTranslations } from "next-intl";

type Step = ReturnType<typeof useStep3>;

export function Step3PersonalDetails({
  t,
  formData,
  setFormData,
  errors,
  signedInEmail,
}: Pick<Step, "formData" | "setFormData" | "errors" | "signedInEmail"> & {
  t: ReturnType<typeof useTranslations>;
}) {
  const { geo } = useGeo();
  const locale = useLocale();
  const marketing = useTranslations("Marketing");
  const prefilledRef = useRef(false);
  const emailLocked =
    Boolean(signedInEmail) &&
    formData.email.trim().toLowerCase() === signedInEmail.trim().toLowerCase();

  // Seed the visitor's dial code once, and never overwrite what they typed.
  useEffect(() => {
    if (prefilledRef.current || !geo.dialCode) return;
    prefilledRef.current = true;
    setFormData((prev) =>
      prev.phone.trim() ? prev : { ...prev, phone: `+${geo.dialCode} ` }
    );
  }, [geo.dialCode, setFormData]);

  return (
    <>
        {/* Personal Details */}
        <Card className="p-5">
          <h3 className="font-semibold mb-4 text-lg">{t('Step3.personal-details')}</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium block mb-2">
                  {t('Step3.first-name')} </label>
                <Input
                  placeholder={t('Step3.john')}
                  className={errors.firstName ? "border-[var(--err)]" : ""}
                  value={formData.firstName}
                  aria-invalid={!!errors.firstName}
                  aria-describedby={errors.firstName ? "first-name-error" : undefined}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      firstName: e.target.value,
                    }));
                  }}
                />
                {errors.firstName && (
                  <p id="first-name-error" className="text-[color:var(--err)] text-xs mt-1">
                    {errors.firstName}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">
                  {t('Step3.last-name')} </label>
                <Input
                  placeholder={t('Step3.doe')}
                  className={errors.lastName ? "border-[var(--err)]" : ""}
                  value={formData.lastName}
                  aria-invalid={!!errors.lastName}
                  aria-describedby={errors.lastName ? "last-name-error" : undefined}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      lastName: e.target.value,
                    }));
                  }}
                />
                {errors.lastName && (
                  <p id="last-name-error" className="text-[color:var(--err)] text-xs mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <label className="text-sm font-medium">
                  {t('Step3.email-address')} </label>
                {emailLocked && (
                  <span id="email-signed-in" className="text-xs text-muted-foreground">
                    {t('Step3.signed-in')}
                  </span>
                )}
              </div>
              <Input
                type="email"
                placeholder="john.doe@example.com"
                className={`${errors.email ? "border-[var(--err)]" : ""} ${emailLocked ? "bg-muted text-muted-foreground" : ""}`}
                value={formData.email}
                readOnly={emailLocked}
                aria-invalid={!!errors.email}
                aria-describedby={
                  errors.email ? "email-error" : emailLocked ? "email-signed-in" : undefined
                }
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, email: e.target.value }));
                }}
              />
              {errors.email && (
                <p id="email-error" className="text-[color:var(--err)] text-xs mt-1">{errors.email}</p>
              )}
              {emailLocked && (
                <p className="text-xs text-muted-foreground mt-1">
                  <Link
                    href={`/${locale}/account`}
                    className="underline underline-offset-2 rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {t('Step3.not-you')}
                  </Link>
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">
                {t('Step3.phone-number')} </label>
              <Input
                type="tel"
                autoComplete="tel"
                placeholder="+41 76 123 4567"
                className={errors.phone ? "border-[var(--err)]" : ""}
                value={formData.phone}
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? "phone-error" : undefined}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, phone: e.target.value }));
                }}
              />
              {errors.phone && (
                <p id="phone-error" className="text-[color:var(--err)] text-xs mt-1">{errors.phone}</p>
              )}
            </div>
            <fieldset className="space-y-1 rounded-md border border-border/60 p-3">
              <legend className="px-1 text-sm font-medium">
                {marketing("checkout-title")}
              </legend>
              <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-sm text-sm">
                <Checkbox
                  className="mt-0.5"
                  checked={formData.marketingEmailOptIn}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      marketingEmailOptIn: checked === true,
                    }))
                  }
                />
                <span>{marketing("checkout-email")}</span>
              </label>
              <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-sm text-sm">
                <Checkbox
                  className="mt-0.5"
                  checked={formData.marketingWhatsappOptIn}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      marketingWhatsappOptIn: checked === true,
                    }))
                  }
                />
                <span>
                  {marketing("checkout-whatsapp")}
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {marketing("checkout-whatsapp-hint")}
                  </span>
                </span>
              </label>
            </fieldset>
            <p className="text-sm text-muted-foreground">
              {t("Step3.whatsapp_confirmation-note")}
            </p>
          </div>
        </Card>
    </>
  );
}
