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
  extras,
  errors,
  promoAvailable,
}: Pick<
  Step,
  "formData" | "setFormData" | "childSeatPrice" | "babySeatPrice" | "extras" | "errors" | "promoAvailable"
> & {
  t: ReturnType<typeof useTranslations>;
  currencySymbol: string;
}) {
  return (
    <>
        {/* Optional Extras */}
        <Card className="p-5">
          <h3 className="font-semibold mb-4 text-lg">{t('Step3.optional-extras')}</h3>
          <div className="space-y-4">
            {extras.childSeat.enabled ? (
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">{t('Step3.child-seats')}</label>
              <div className="flex items-center gap-3">
                <span className="text-sm text-[var(--ink2)]">
                  {currencySymbol}{childSeatPrice} {t('Step3.each')}
                </span>
                <Input
                  type="number"
                  min="0"
                  max="5"
                  className={`w-20 ${errors.childSeats ? "border-destructive" : ""}`}
                  value={formData.childSeats === 0 ? "" : formData.childSeats}
                  placeholder="0"
                  aria-invalid={!!errors.childSeats}
                  aria-describedby={errors.childSeats ? "child-seats-error" : undefined}
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
                {errors.childSeats && (
                  <p id="child-seats-error" className="mt-1 text-xs text-destructive">
                    {errors.childSeats}
                  </p>
                )}
              </div>
            </div>
            ) : null}
            {extras.babySeat.enabled ? (
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">{t('Step3.baby-seats')}</label>
              <div className="flex items-center gap-3">
                <span className="text-sm text-[var(--ink2)]">
                  {currencySymbol}{babySeatPrice} {t('Step3.each')}
                </span>
                <Input
                  type="number"
                  min="0"
                  max="5"
                  className={`w-20 ${errors.babySeats ? "border-destructive" : ""}`}
                  value={formData.babySeats === 0 ? "" : formData.babySeats}
                  placeholder="0"
                  aria-invalid={!!errors.babySeats}
                  aria-describedby={errors.babySeats ? "baby-seats-error" : undefined}
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
                {errors.babySeats && (
                  <p id="baby-seats-error" className="mt-1 text-xs text-destructive">
                    {errors.babySeats}
                  </p>
                )}
              </div>
            </div>
            ) : null}
            <input
              type="text"
              name="companyWebsite"
              value={formData.companyWebsite}
              onChange={(event) => setFormData((prev) => ({ ...prev, companyWebsite: event.target.value }))}
              className="absolute h-0 w-0 overflow-hidden"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />
            {extras.meetGreet.enabled ? (
              <label className="flex min-h-11 items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  className="size-5 shrink-0 accent-primary"
                  checked={formData.meetAndGreet}
                  onChange={(event) => setFormData((prev) => ({ ...prev, meetAndGreet: event.target.checked }))}
                />
                <span className="flex-1">{t("Step3.meet-greet")}</span>
                <span className="font-medium tabular-nums">
                  +{currencySymbol}{extras.meetGreet.price.toFixed(2)}
                </span>
              </label>
            ) : null}
            {promoAvailable ? (
              <div>
                <label className="mb-2 block text-sm font-medium" htmlFor="promo-code">{t("Step3.promo-code")}</label>
                <Input
                  id="promo-code"
                  className="h-11"
                  value={formData.promoCode}
                  onChange={(event) => setFormData((prev) => ({ ...prev, promoCode: event.target.value }))}
                />
              </div>
            ) : null}
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
