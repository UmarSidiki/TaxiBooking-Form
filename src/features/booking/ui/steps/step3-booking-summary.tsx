"use client";

import { Card } from "@/shared/ui/card";
import {
  Calendar,
  Car,
  CheckCircle2,
  Clock,
  CreditCard,
  Mail,
  MapPin,
  Phone,
  Shield,
  Users,
} from "lucide-react";
import { FareDueRows } from "@/features/booking/ui/steps/fare-due-rows";
import type { useStep3 } from "@/features/booking/hooks/form-steps/useStep3";
import type { useTranslations } from "next-intl";

type Step = ReturnType<typeof useStep3>;

export function Step3BookingSummary({
  t,
  currencySymbol,
  mapLoaded,
  mapRef,
  formData,
  selectedVehicle,
  distanceData,
  vehiclePrice,
  discount,
  discountedVehiclePrice,
  childSeatPrice,
  babySeatPrice,
  stopsTotalPrice,
  subtotalPrice,
  enableTax,
  taxPercentage,
  taxIncluded,
  taxAmount,
  totalPrice,
  chargeAmount,
  balanceDue,
  displaySubtotalAmount,
}: Pick<
  Step,
  | "mapLoaded"
  | "mapRef"
  | "formData"
  | "selectedVehicle"
  | "distanceData"
  | "vehiclePrice"
  | "discount"
  | "discountedVehiclePrice"
  | "childSeatPrice"
  | "babySeatPrice"
  | "stopsTotalPrice"
  | "subtotalPrice"
  | "enableTax"
  | "taxPercentage"
  | "taxIncluded"
  | "taxAmount"
  | "totalPrice"
  | "chargeAmount"
  | "balanceDue"
  | "displaySubtotalAmount"
> & {
  t: ReturnType<typeof useTranslations>;
  currencySymbol: string;
}) {
  return (
    <>
      {/* Sidebar - Booking Summary */}
      <div className="lg:col-span-1">
        <Card className="sticky top-4 p-5 space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2">{t('Step3.booking-summary')}</h3>

          {/* Map */}
          {mapLoaded && (
            <div className="border rounded overflow-hidden">
              <div
                ref={mapRef}
                className="w-full h-48 bg-[var(--well)]"
                style={{ minHeight: "200px" }}
              />
            </div>
          )}

          {/* Selected Vehicle */}
          {selectedVehicle && (
            <div className="border-t pt-3">
              <div className="flex items-center gap-2 mb-2">
                <Car className="h-4 w-4" style={{ color: "var(--ink2)" }} />
                <span className="font-semibold text-sm">{t('Step3.selected-vehicle')}</span>
              </div>
              <div className="bg-[var(--well)] p-3 rounded">
                <p className="font-medium">{selectedVehicle.name}</p>
                <p className="text-xs text-[color:var(--ink2)] mt-1">
                  {selectedVehicle.description}
                </p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-[color:var(--ink2)]">{t('Step3.base-fare')}</span>
                  <div className="text-right">
                    {discount > 0 ? (
                      <>
                        <span className="text-xs text-[color:var(--ink2)] line-through mr-2">
                          {currencySymbol}{vehiclePrice.toFixed(2)}
                        </span>
                        <span className="font-semibold">
                          {currencySymbol}{discountedVehiclePrice.toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <span className="font-semibold">
                        {currencySymbol}{vehiclePrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Extras */}
          {(formData.childSeats > 0 || formData.babySeats > 0 || stopsTotalPrice > 0) && (
            <div className="border-t pt-3">
              <p className="font-semibold text-sm mb-2">{t('Step3.extras')}</p>
              <div className="space-y-1 text-sm">
                {formData.childSeats > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[color:var(--ink2)]">
                      {t('Step3.child-seatsx')} {formData.childSeats}
                    </span>
                    <span className="font-medium">
                      {currencySymbol}{(formData.childSeats * childSeatPrice).toFixed(2)}
                    </span>
                  </div>
                )}
                {formData.babySeats > 0 && (
                  <div className="flex justify-between">
                    <span className="text-[color:var(--ink2)]">
                      {t('Step3.baby-seatsx')} {formData.babySeats}
                    </span>
                    <span className="font-medium">
                      {currencySymbol}{(formData.babySeats * babySeatPrice).toFixed(2)}
                    </span>
                  </div>
                )}
                {stopsTotalPrice > 0 && (() => {
                  const validStops = formData.stops?.filter(stop => stop.location.trim()) || [];
                  const basePrice = selectedVehicle?.stopPrice || 0;
                  const pricePerHour = selectedVehicle?.stopPricePerHour || 0;
                  
                  return (
                    <div>
                      <div className="flex justify-between font-medium">
                        <span className="text-[color:var(--ink2)]">
                          {t('Dashboard.Rides.Stops')} ({validStops.length})
                        </span>
                        <span>
                          {currencySymbol}{stopsTotalPrice.toFixed(2)}
                        </span>
                      </div>
                      <div className="ml-2 mt-1 space-y-0.5 text-xs text-[color:var(--ink2)]">
                        {validStops.map((stop, index) => {
                          const baseCost = basePrice;
                          let durationCost = 0;
                          if (stop.duration && stop.duration > 0) {
                            const hours = stop.duration / 60;
                            durationCost = pricePerHour * hours;
                          }
                          const totalCost = baseCost + durationCost;
                          
                          return (
                            <div key={index} className="flex justify-between">
                              <span>
                                {t('Step1.stop')} {index + 1}
                                {(stop.duration || 0) > 0 && (
                                  <span className="ml-1">({stop.duration}m wait)</span>
                                )}
                              </span>
                              <span>
                                {currencySymbol}{totalCost.toFixed(2)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Total */}
          <div className="border-t pt-3">
            {enableTax && taxPercentage > 0 ? (
              <>
                <div className="flex justify-between items-center text-sm text-[color:var(--ink2)] mb-1">
                  <span>{t("Step3.subtotal")}</span>
                  <span>
                    {currencySymbol}{displaySubtotalAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm text-[color:var(--ink2)] mb-2">
                  <span>{t("Step3.tax", { 0: taxPercentage })}{taxIncluded ? ` - ${t("Step3.included")}` : ''}</span>
                  <span>
                    {currencySymbol}{taxAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>{t("Step3.total-incl-tax")}</span>
                  <span className="num text-2xl font-semibold" style={{ color: "var(--ink)" }}>
                    {currencySymbol}{totalPrice.toFixed(2)}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex justify-between items-center text-lg font-bold">
                <span>{t("Step2.total")}</span>
                <span className="num text-2xl font-semibold" style={{ color: "var(--ink)" }}>
                  {currencySymbol}{totalPrice.toFixed(2)}
                </span>
              </div>
            )}
            <FareDueRows
              currencySymbol={currencySymbol}
              totalPrice={totalPrice}
              chargeAmount={chargeAmount}
              balanceDue={balanceDue}
              dueNowLabel={t("Step3.due-now")}
              balanceLabel={t("Step3.balance-due")}
            />
          </div>

          {/* Benefits */}
          <div className="border-t pt-3 space-y-2">
            <h4 className="font-semibold text-sm mb-2">{t('Step3.what-and-apos-s-included')}</h4>
            <div className="space-y-2 text-xs text-[color:var(--ink)]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[color:var(--ink2)]" />
                <span>{t('Step3.door-to-door-service')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[color:var(--ink2)]" />
                <span>{t('Step3.meet-and-greet')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[color:var(--ink2)]" />
                <span>{t('Step3.instant-confirmation')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-[color:var(--ink2)]" />
                <span>{t('Step3.secure-payment')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[color:var(--ink2)]" />
                <span>{t('Step3.free-cancellation-24h')}</span>
              </div>
            </div>
          </div>

          {/* Support */}
          <div className="border-t pt-3 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-semibold">
              <CreditCard className="h-4 w-4 text-[color:var(--ink2)]" />
              <span>{t('Step3.24-7-customer-support')}</span>
            </div>
            {process.env.NEXT_PUBLIC_SUPPORT_EMAIL ? (
              <div className="flex items-center gap-2 text-foreground">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}`}
                  className="inline-flex min-h-11 items-center hover:text-primary"
                >
                  {process.env.NEXT_PUBLIC_SUPPORT_EMAIL}
                </a>
              </div>
            ) : null}
            {process.env.NEXT_PUBLIC_PHONE_NUMBER ? (
              <div className="flex items-center gap-2 text-foreground">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`tel:${process.env.NEXT_PUBLIC_PHONE_NUMBER}`}
                  className="inline-flex min-h-11 items-center hover:text-primary"
                >
                  {process.env.NEXT_PUBLIC_PHONE_NUMBER}
                </a>
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    </>
  );
}
