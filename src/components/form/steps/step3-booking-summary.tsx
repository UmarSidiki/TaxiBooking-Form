"use client";

import { Card } from "@/components/ui/card";
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
import type { useStep3 } from "@/hooks/form/form-steps/useStep3";
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
          <h3 className="font-bold text-lg border-b pb-2">{t('Step3.booking-summary')}</h3>

          {/* Map */}
          {mapLoaded && (
            <div className="border rounded-lg overflow-hidden">
              <div
                ref={mapRef}
                className="w-full h-48 bg-gray-100"
                style={{ minHeight: "200px" }}
              />
            </div>
          )}

          {/* Trip Details */}
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <MapPin className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">{t('Step3.pickup')}</p>
                <p className="font-medium text-gray-900">{formData.pickup}</p>
              </div>
            </div>

            {/* Stops */}
            {formData.stops
              .filter(stop => stop.location.trim())
              .map((stop, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="flex items-center justify-center w-5 h-5 bg-blue-100 rounded-full flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-gray-600">{index + 1}</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{t('Step1.stop')} {index + 1}</p>
                    <p className="font-medium text-gray-900">{stop.location}</p>
                  </div>
                </div>
              ))}

            {formData.bookingType === "destination" ? (
              <>
                <div className="flex items-start gap-2">
                  <MapPin className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">{t('Step3.dropoff')}</p>
                    <p className="font-medium text-gray-900">
                      {formData.dropoff}
                    </p>
                  </div>
                </div>

                {distanceData && (
                  <>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-600" />
                      <span className="text-gray-700">
                        {distanceData.duration.text}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <svg
                        className="h-4 w-4 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                        />
                      </svg>
                      <span className="text-gray-700">
                        {distanceData.distance.text} -{" "}
                        {formData.tripType === "oneway"
                          ? t('Step3.one-way')
                          : t('Step3.round-trip')}
                      </span>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-600" />
                <span className="text-gray-700">
                  {formData.duration}{" "}
                  {formData.duration === 1 ? "hour" : "hours"} {t('Step3.hourly-booking')}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-600" />
              <span className="text-gray-700">
                {formData.tripType === "roundtrip" ? t('Step3.departure') : t('Step3.date')}: {formData.date} at {formData.time}
              </span>
            </div>

            {formData.tripType === "roundtrip" && formData.returnDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-600" />
                <span className="text-gray-700">
                  {t('Step3.return')}: {formData.returnDate} at {formData.returnTime}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-600" />
              <span className="text-gray-700">
                {formData.passengers} Passenger(s)
              </span>
            </div>
          </div>

          {/* Selected Vehicle */}
          {selectedVehicle && (
            <div className="border-t pt-3">
              <div className="flex items-center gap-2 mb-2">
                <Car className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm">{t('Step3.selected-vehicle')}</span>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-medium">{selectedVehicle.name}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {selectedVehicle.description}
                </p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-600">{t('Step3.base-fare')}</span>
                  <div className="text-right">
                    {discount > 0 ? (
                      <>
                        <span className="text-xs text-gray-400 line-through mr-2">
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
                    <span className="text-gray-600">
                      {t('Step3.child-seatsx')} {formData.childSeats}
                    </span>
                    <span className="font-medium">
                      {currencySymbol}{(formData.childSeats * childSeatPrice).toFixed(2)}
                    </span>
                  </div>
                )}
                {formData.babySeats > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">
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
                        <span className="text-gray-600">
                          {t('Dashboard.Rides.Stops')} ({validStops.length})
                        </span>
                        <span>
                          {currencySymbol}{stopsTotalPrice.toFixed(2)}
                        </span>
                      </div>
                      <div className="ml-2 mt-1 space-y-0.5 text-xs text-gray-500">
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
                <div className="flex justify-between items-center text-sm text-gray-600 mb-1">
                  <span>{t("Step3.subtotal")}</span>
                  <span>
                    {currencySymbol}{displaySubtotalAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                  <span>{t("Step3.tax", { 0: taxPercentage })}{taxIncluded ? ` - ${t("Step3.included")}` : ''}</span>
                  <span>
                    {currencySymbol}{taxAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>{t("Step3.total-incl-tax")}</span>
                  <span className="text-2xl text-primary">
                    {currencySymbol}{totalPrice.toFixed(2)}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex justify-between items-center text-lg font-bold">
                <span>{t("Step2.total")}</span>
                <span className="text-2xl text-primary">
                  {currencySymbol}{totalPrice.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Benefits */}
          <div className="border-t pt-3 space-y-2">
            <h4 className="font-semibold text-sm mb-2">{t('Step3.what-and-apos-s-included')}</h4>
            <div className="space-y-2 text-xs text-gray-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>{t('Step3.door-to-door-service')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>{t('Step3.meet-and-greet')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>{t('Step3.instant-confirmation')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-600" />
                <span>{t('Step3.secure-payment')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>{t('Step3.free-cancellation-24h')}</span>
              </div>
            </div>
          </div>

          {/* Support */}
          <div className="border-t pt-3 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-semibold">
              <CreditCard className="h-4 w-4 text-blue-600" />
              <span>{t('Step3.24-7-customer-support')}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Mail className="h-4 w-4 text-gray-500" />
              <a
                href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL}`}
                className="hover:text-primary"
              >
                {process.env.NEXT_PUBLIC_SUPPORT_EMAIL}
              </a>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Phone className="h-4 w-4 text-gray-500" />
              <a href={`tel:${process.env.NEXT_PUBLIC_PHONE_NUMBER}`} className="hover:text-primary">
                {process.env.NEXT_PUBLIC_PHONE_NUMBER}
              </a>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
