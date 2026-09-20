"use client";

import { Input } from "@/shared/ui/input";
import { Card } from "@/shared/ui/card";
import type { useStep3 } from "@/features/booking/hooks/form-steps/useStep3";
import type { useTranslations } from "next-intl";

type Step = ReturnType<typeof useStep3>;

export function Step3Extras({
  t,
  currencySymbol,
  formData,
  setFormData,
  childSeatPrice,
  babySeatPrice,
  errors,
}: Pick<Step, "formData" | "setFormData" | "childSeatPrice" | "babySeatPrice" | "errors"> & {
  t: ReturnType<typeof useTranslations>;
  currencySymbol: string;
}) {
  return (
    <>
        {/* Optional Extras */}
        <Card className="p-5">
          <h3 className="font-semibold mb-4 text-lg">{t('Step3.optional-extras')}</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">{t('Step3.child-seats')}</label>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">
                  {currencySymbol}{childSeatPrice} {t('Step3.each')}
                </span>
                <Input
                  type="number"
                  min="0"
                  max="5"
                  className={`w-20 ${(errors as any).childSeats ? "border-red-500" : ""}`}
                  value={formData.childSeats === 0 ? "" : formData.childSeats}
                  placeholder="0"
                  aria-invalid={!!(errors as any).childSeats}
                  aria-describedby={(errors as any).childSeats ? "child-seats-error" : undefined}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "") {
                      setFormData((prev) => ({ ...prev, childSeats: 0 }));
                      return;
                    }
                    const numValue = parseInt(value, 10);
                    if (!isNaN(numValue) && numValue >= 0 && numValue <= 5) {
                      setFormData((prev) => ({ ...prev, childSeats: numValue }));
                    }
                  }}
                  onBlur={() => {
                    if (isNaN(formData.childSeats) || formData.childSeats < 0) {
                      setFormData((prev) => ({ ...prev, childSeats: 0 }));
                    }
                  }}
                />
                {(errors as any).childSeats && (
                  <p id="child-seats-error" className="text-red-500 text-xs mt-1">
                    {(errors as any).childSeats}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">{t('Step3.baby-seats')}</label>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">
                  {currencySymbol}{babySeatPrice} {t('Step3.each')}
                </span>
                <Input
                  type="number"
                  min="0"
                  max="5"
                  className={`w-20 ${(errors as any).babySeats ? "border-red-500" : ""}`}
                  value={formData.babySeats === 0 ? "" : formData.babySeats}
                  placeholder="0"
                  aria-invalid={!!(errors as any).babySeats}
                  aria-describedby={(errors as any).babySeats ? "baby-seats-error" : undefined}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "") {
                      setFormData((prev) => ({ ...prev, babySeats: 0 }));
                      return;
                    }
                    const numValue = parseInt(value, 10);
                    if (!isNaN(numValue) && numValue >= 0 && numValue <= 5) {
                      setFormData((prev) => ({ ...prev, babySeats: numValue }));
                    }
                  }}
                  onBlur={() => {
                    if (isNaN(formData.babySeats) || formData.babySeats < 0) {
                      setFormData((prev) => ({ ...prev, babySeats: 0 }));
                    }
                  }}
                />
                {(errors as any).babySeats && (
                  <p id="baby-seats-error" className="text-red-500 text-xs mt-1">
                    {(errors as any).babySeats}
                  </p>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">
                {t('Step3.special-requests-optional')} </label>
              <Input
                placeholder={t('Step3.any-special-requirements-or-notes')}
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">
                {t('Step3.flight-number-optional')} </label>
              <Input
                placeholder="e.g. LH 1234"
                value={formData.flightNumber}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, flightNumber: e.target.value }))
                }
              />
            </div>
          </div>
        </Card>
    </>
  );
}
