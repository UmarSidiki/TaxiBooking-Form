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
  Flag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useStep2 } from "@/hooks/form/form-steps/useStep2";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCurrency } from "@/contexts/CurrencyContext";

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

  const { currencySymbol } = useCurrency();

  const t = useTranslations();

  // Sort vehicles by calculated price (lowest first) with proper handling for different booking types
  const sortedVehicles = [...vehicles].sort((a, b) => {
    const priceA = calculatePrice(a);
    const priceB = calculatePrice(b);
    return priceA - priceB;
  });

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
          <div className="space-y-2">
            {sortedVehicles.map((vehicle, index) => {
              const calculatedPrice = calculatePrice(vehicle);
              const originalPrice = calculateOriginalPrice(vehicle);
              const isSelected = formData.selectedVehicle === vehicle._id;
              const isBestPrice = index === 0; // First vehicle after sorting is the cheapest
              const discountValue = parseFloat(String(vehicle.discount || "0"));

              return (
                <Card
                  key={vehicle._id}
                  className={`relative overflow-hidden transition-all ${
                    isSelected
                      ? "border-primary border-2 shadow-lg"
                      : isBestPrice
                      ? "border-secondary border-2"
                      : "border-gray-200 hover:border-primary/70"
                  }`}
                >
                  <div className="p-3 sm:p-4">
                    {/* Vehicle Image - Full width on mobile, side-by-side on desktop */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="w-full sm:w-auto flex-shrink-0">
                        {vehicle.image ? (
                          <Image
                            src={vehicle.image}
                            alt={vehicle.name}
                            width={200}
                            height={150}
                            className="w-full sm:w-[200px] sm:h-[180px] h-[150px] rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-full sm:w-[200px] sm:h-[180px] h-[150px] bg-gray-200 rounded-lg flex items-center justify-center">
                            <span className="text-gray-400 text-sm">
                              {t("Step2.no-image")}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Vehicle Details */}
                      <div className="flex-1 flex flex-col">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-1">
                          <div className="mb-1 sm:mb-0">
                            <h3 className="font-bold text-lg sm:text-base">
                              {vehicle.name}
                            </h3>
                            <div className="flex flex-wrap gap-1">
                              {isBestPrice && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                                  {t("Step2.best-price")}
                                </span>
                              )}
                              {discountValue > 0 && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
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
                                  {currencySymbol}{originalPrice.toFixed(2)}
                                </p>
                              )}
                            <p className="text-xl font-bold text-gray-900">
                              {currencySymbol}{calculatedPrice.toFixed(2)}
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

                        {/* Features Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm text-gray-700 mb-2">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-600 flex-shrink-0" />
                            <span>
                              {t("Step2.passenger-allowance", {
                                persons: vehicle.persons || "",
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg
                              className="h-4 w-4 text-blue-600 flex-shrink-0"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                              <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                            </svg>
                            <span>
                              {t("Step2.baggage-allowance", {
                                baggages: vehicle.baggages || "",
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-green-600 flex-shrink-0" />
                            <span>{t("Step2.licensed-chauffeur")}</span>
                          </div>
                          {vehicle.minimumFare && (
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                              <span>{t("Step2.free-cancellation")}</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-auto">
                          <Button
                            onClick={() => handleVehicleSelect(vehicle._id!)}
                            className={`w-full py-2 text-base font-medium ${
                              isSelected
                                ? "bg-primary hover:bg-primary/90"
                                : "bg-secondary hover:bg-secondary/90"
                            } text-white`}
                          >
                            {isSelected
                              ? t("Step2.selected")
                              : t("Step2.select")}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <Button onClick={handleBack} variant="outline" className="w-full">
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
              <MapPin className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-gray-700">
                  {formData.pickup || t("Step2.pickup-location")}
                </p>
              </div>
            </div>

            {formData.bookingType === "destination" ? (
              <>
                {/* Stops */}
                {formData.stops.map((stop, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="h-5 w-5 rounded-full bg-blue-100 border-2 border-gray-600 flex items-center justify-center text-xs font-bold text-gray-600">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-gray-700">
                        {stop.location || `Stop ${index + 1}`}
                      </p>
                    </div>
                  </div>
                ))}

                <div className="flex items-start gap-2">
                  <Flag className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="text-gray-700">
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

            {formData.tripType === "roundtrip" && formData.returnDate ? (
              <>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-600" />
                  <span className="text-gray-700">
                    {t("Step2.departure")}: {formData.date || t("Step2.date-not-set")} at {formData.time || t("Step2.time-not-set")}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-600" />
                  <span className="text-gray-700">
                    {t("Step2.return")}: {formData.returnDate} at {formData.returnTime}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-600" />
                <span className="text-gray-700">
                  {formData.date || t("Step2.date-not-set")} at {formData.time || t("Step2.time-not-set")}
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

          {/* Selected Vehicle Price */}
          {formData.selectedVehicle && vehicles.length > 0 && (() => {
            const selectedVehicle = vehicles.find((v) => v._id === formData.selectedVehicle)!;
            const totalPrice = calculatePrice(selectedVehicle);
            
            // Calculate stop costs separately for display
            let stopCosts = 0;
            if (formData.stops && formData.stops.length > 0) {
              const stopBasePrice = selectedVehicle.stopPrice || 0;
              const stopPricePerHour = selectedVehicle.stopPricePerHour || 0;
              
              formData.stops.forEach(stop => {
                stopCosts += stopBasePrice;
                if (stop.duration && stop.duration > 0) {
                  const hours = stop.duration / 60;
                  stopCosts += stopPricePerHour * hours;
                }
              });
            }
            
            return (
              <div className="border-t pt-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">
                    {t("Step2.vehicle-type")}
                  </span>
                  <span className="text-sm font-medium">
                    {selectedVehicle.category}
                  </span>
                </div>
                
                {/* Stop costs breakdown */}
                {stopCosts > 0 && (
                  <div className="flex justify-between items-center mb-1 text-sm">
                    <span className="text-gray-600">
                      Stops ({formData.stops?.length || 0})
                    </span>
                    <span className="font-medium">
                      {currencySymbol}{stopCosts.toFixed(2)}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>TOTAL</span>
                  <div className="text-right">
                    <p className="text-gray-900">
                      {currencySymbol}{totalPrice.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

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