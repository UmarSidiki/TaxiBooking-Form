"use client";

import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import type { useStep3 } from "@/hooks/form/form-steps/useStep3";
import type { useTranslations } from "next-intl";

type Step = ReturnType<typeof useStep3>;

export function Step3PersonalDetails({
  t,
  formData,
  setFormData,
  errors,
}: Pick<Step, "formData" | "setFormData" | "errors"> & {
  t: ReturnType<typeof useTranslations>;
}) {
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
                  className={errors.firstName ? "border-red-500" : ""}
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
                  <p id="first-name-error" className="text-red-500 text-xs mt-1">
                    {errors.firstName}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">
                  {t('Step3.last-name')} </label>
                <Input
                  placeholder={t('Step3.doe')}
                  className={errors.lastName ? "border-red-500" : ""}
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
                  <p id="last-name-error" className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">
                {t('Step3.email-address')} </label>
              <Input
                type="email"
                placeholder="john.doe@example.com"
                className={errors.email ? "border-red-500" : ""}
                value={formData.email}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, email: e.target.value }));
                }}
              />
              {errors.email && (
                <p id="email-error" className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">
                {t('Step3.phone-number')} </label>
              <Input
                placeholder="+41 76 123 4567"
                className={errors.phone ? "border-red-500" : ""}
                value={formData.phone}
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? "phone-error" : undefined}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, phone: e.target.value }));
                }}
              />
              {errors.phone && (
                <p id="phone-error" className="text-red-500 text-xs mt-1">{errors.phone}</p>
              )}
            </div>
          </div>
        </Card>
    </>
  );
}
