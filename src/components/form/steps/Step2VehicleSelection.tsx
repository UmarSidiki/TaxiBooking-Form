"use client";

import React from "react";
import {
  ArrowLeft,
  Loader2,
  MapPin,
  Clock,
  Calendar,
  Users,
  CheckCircle2,
  Shield,
  CreditCard,
  Phone,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useStep2 } from "@/hooks/form/form-steps/useStep2";
import Image from "next/image";
import { useTranslations } from "next-intl";

export default function Step2VehicleSelection() {
  const {
    // State
    mapLoaded,
    mapRef,

    // Context values
    formData,
    vehicles,
    distanceData,

    // Functions
    calculatePrice,
    calculateOriginalPrice,
    handleVehicleSelect,
    handleBack,
  } = useStep2();

  const t = useTranslations();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content - Vehicle Selection */}
      <div className="lg:col-span-2 space-y-4">
        {/* Map Section */}
        <div className="relative w-full h-48 sm:h-56 rounded-xl overflow-hidden bg-gray-200">
          <div ref={mapRef} className="w-full h-full" />
          {!mapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">
            {t("Step2.select-your-vehicle")}
          </h2>
          <p className="text-gray-600 text-sm">
            {t("Step2.choose-the-perfect-vehicle-for-your-journey")}
          </p>
        </div>

        {vehicles.length === 0 ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
            <p className="text-gray-500 text-sm">
              {t("Step2.loading-available-vehicles")}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {vehicles.map((vehicle) => {
              const calculatedPrice = calculatePrice(vehicle);
              const originalPrice = calculateOriginalPrice(vehicle);
              const isSelected = formData.selectedVehicle === vehicle._id;

              return (
                <Card
                  key={vehicle._id}
                  className={`relative overflow-hidden transition-all ${
                    isSelected
                      ? "border-primary border-2 shadow-lg"
                      : "border-gray-200 hover:border-primary/70"
                  }`}
                >
                  <div className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                      {/* Vehicle Image */}
                      <div className="flex-shrink-0">
                        {vehicle.image ? (
                          <Image
                            src={vehicle.image}
                            alt={vehicle.name}
                            width={120}
                            height={85}
                            className="rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-[120px] h-[85px] bg-gray-200 rounded-lg flex items-center justify-center">
                            <span className="text-gray-400 text-xs">
                              {t("Step2.no-image")}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Vehicle Details */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-1.5">
                          <div>
                            <h3 className="font-bold text-base">
                              {vehicle.name}
                            </h3>
                            <div className="flex gap-1.5 mt-0.5">
                              {vehicle.category && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                                  {vehicle.category === "economy" &&
                                    t("Step2.best-price")}
                                  {vehicle.category === "standard" &&
                                    t("Step2.standard")}
                                  {vehicle.category === "premium" &&
                                    t("Step2.premium")}
                                </span>
                              )}
                              {vehicle.discount && vehicle.discount > 0 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                                  🎉 {vehicle.discount}
                                  {t("Step2.off")}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            {distanceData &&
                              originalPrice > calculatedPrice && (
                                <p className="text-xs text-gray-500 line-through">
                                  €{originalPrice.toFixed(2)}
                                </p>
                              )}
                            <p className="text-xl font-bold text-gray-900">
                              €{calculatedPrice.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formData.bookingType === "hourly"
                                ? `${Math.max(
                                    formData.duration,
                                    vehicle.minimumHours || 2
                                  )} ${t("Step2.hours")}`
                                : distanceData
                                ? formData.tripType === "roundtrip"
                                  ? t("Step2.total-round-trip")
                                  : t("Step2.total-one-way")
                                : t("Step2.starting-from")}
                            </p>
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 mb-2">
                          {vehicle.description}
                        </p>

                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-700 mb-2">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-blue-600" />
                            <span>
                              {t("Step2.passenger-allowance", {
                                persons: vehicle.persons || 0,
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <svg
                              className="h-4 w-4 text-blue-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                              <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                            </svg>
                            <span>
                              {t("Step2.baggage-allowance", {
                                baggages: vehicle.baggages || 0,
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Shield className="h-4 w-4 text-green-600" />
                            <span>{t("Step2.licensed-chauffeur")}</span>
                          </div>
                          {vehicle.minimumFare && (
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <span>{t("Step2.free-cancellation")}</span>
                            </div>
                          )}
                        </div>

                        {/* Pricing breakdown */}
                        {formData.bookingType === "hourly" ? (
                          <p className="text-xs text-gray-500 mb-2">
                            €{vehicle.pricePerHour || 30}
                            {t("Step2.hour")}{" "}
                            {Math.max(
                              formData.duration,
                              vehicle.minimumHours || 2
                            )}{" "}
                            hours
                            {formData.duration < (vehicle.minimumHours || 2) &&
                              t(
                                "Step2.minimum-vehicle-minimumhours-or-or-2-hours"
                              )}
                          </p>
                        ) : (
                          distanceData && (
                            <p className="text-xs text-gray-500 mb-2">
                              {t("Step2.base-fare-eur")}€{vehicle.price} + €
                              {vehicle.pricePerKm}/km ×{" "}
                              {distanceData.distance.km.toFixed(1)} km
                              {calculatedPrice === vehicle.minimumFare &&
                                t(
                                  "Step2.minimum-fare-applied-eur-vehicle-minimumfare"
                                )}
                            </p>
                          )
                        )}

                        <Button
                          onClick={() => handleVehicleSelect(vehicle._id!)}
                          className={`w-full py-2 ${
                            isSelected
                              ? "bg-primary hover:bg-primary/90"
                              : "bg-secondary hover:bg-secondary/90"
                          } text-white`}
                        >
                          {isSelected ? t("Step2.selected") : t("Step2.select")}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <Button
          onClick={handleBack}
          variant="outline"
          className="w-full"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />{" "}
          {t("Step2.back-to-trip-details")}
        </Button>
      </div>

      {/* Sidebar - Trip Summary */}
      <div className="lg:col-span-1">
        <Card className="sticky top-4 p-5 space-y-4">
          <h3 className="font-bold text-lg border-b pb-2">
            {t("Step2.your-trip")}
          </h3>

          {/* Trip Details */}
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <MapPin className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">
                  {formData.pickup || t("Step2.pickup-location")}
                </p>
              </div>
            </div>

            {formData.bookingType === "destination" ? (
              <>
                <div className="flex items-start gap-2">
                  <MapPin className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {formData.dropoff || t("Step2.dropoff-location")}
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
                          ? t("Step2.one-way")
                          : t("Step2.round-trip")}
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
                  {formData.duration === 1 ? "hour" : "hours"}{" "}
                  {t("Step2.hourly-booking")}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-600" />
              <span className="text-gray-700">
                {formData.date || t("Step2.date-not-set")}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-600" />
              <span className="text-gray-700">
                {formData.time || t("Step2.time-not-set")}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-600" />
              <span className="text-gray-700">
                {formData.passengers} Passenger(s)
              </span>
            </div>
          </div>

          {/* Selected Vehicle Price */}
          {formData.selectedVehicle && vehicles.length > 0 && (
            <div className="border-t pt-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">
                  {t("Step2.vehicle-type")}
                </span>
                <span className="text-sm font-medium">
                  {vehicles.find((v) => v._id === formData.selectedVehicle)
                    ?.category || t("Step2.economy")}
                </span>
              </div>
              <div className="flex justify-between items-center text-lg font-bold">
                <span>TOTAL</span>
                <div className="text-right">
                  <p className="text-gray-900">
                    €
                    {calculatePrice(
                      vehicles.find((v) => v._id === formData.selectedVehicle)!
                    ).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Benefits */}
          <div className="border-t pt-3 space-y-2">
            <h4 className="font-semibold text-sm mb-2">
              {t("Step2.included-services")}
            </h4>
            <div className="space-y-2 text-xs text-gray-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>{t("Step2.door-to-door")}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>{t("Step2.meet-and-greet")}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>{t("Step2.instant-booking-confirmation")}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>{t("Step2.no-further-costs")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-600" />
                <span>{t("Step2.secure-payment-methods")}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>{t("Step2.easy-cancellation")}</span>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="border-t pt-3">
            <div className="flex justify-center gap-2 flex-wrap opacity-70">
              <Image
                src="/visa.webp"
                alt="Visa"
                width={35}
                height={25}
                className="h-6 w-auto"
              />
              <Image
                src="/mastercard.webp"
                alt="MasterCard"
                width={35}
                height={25}
                className="h-6 w-auto"
              />
              <Image
                src="/paypal.webp"
                alt="PayPal"
                width={35}
                height={25}
                className="h-6 w-auto"
              />
              <Image
                src="/twint.webp"
                alt="Twint"
                width={35}
                height={25}
                className="h-6 w-auto"
              />
              <Image
                src="/applepay.webp"
                alt="Apple Pay"
                width={35}
                height={25}
                className="h-6 w-auto"
              />
            </div>
          </div>

          {/* Support */}
          <div className="border-t pt-3 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-semibold">
              <CreditCard className="h-4 w-4 text-blue-600" />
              <span>{t("Step2.24-7-support")}</span>
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
              <a
                href={`tel:${process.env.NEXT_PUBLIC_PHONE_NUMBER}`}
                className="hover:text-primary"
              >
                {process.env.NEXT_PUBLIC_PHONE_NUMBER}
              </a>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
