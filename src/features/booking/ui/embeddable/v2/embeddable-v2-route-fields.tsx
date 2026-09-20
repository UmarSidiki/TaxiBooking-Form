"use client";

import { Input } from "@/components/ui/input";
import type { FormData, FormErrors } from "@/contexts/BookingFormContext";
import { STOP_WAIT_OPTIONS_10_MIN } from "@/lib/form/stop-wait-duration-options";
import {
  AlertCircle,
  ArrowRight,
  Clock,
  MapPin,
  RefreshCw,
  X,
} from "lucide-react";
import type { useTranslations } from "next-intl";
import type { MutableRefObject, ReactNode, RefObject } from "react";

type TFn = ReturnType<typeof useTranslations>;

export function EmbeddableV2RouteFields({
  t,
  formData,
  errors,
  isHourly,
  focusedField,
  setFocusedField,
  pickupInputRef,
  dropoffInputRef,
  stopInputRefs,
  setBookingType,
  setTripType,
  setDuration,
  handleInputChange,
  handleInputBlur,
  handleAddStop,
  handleRemoveStop,
  handleStopChange,
  handleStopDurationChange,
  children,
}: {
  t: TFn;
  formData: FormData;
  errors: FormErrors;
  isHourly: boolean;
  focusedField: string | null;
  setFocusedField: (field: string | null) => void;
  pickupInputRef: RefObject<HTMLInputElement | null>;
  dropoffInputRef: RefObject<HTMLInputElement | null>;
  stopInputRefs: MutableRefObject<Array<HTMLInputElement | null>>;
  setBookingType: (type: FormData["bookingType"]) => void;
  setTripType: (type: FormData["tripType"]) => void;
  setDuration: (duration: number) => void;
  handleInputChange: (field: string, value: string | number) => void;
  handleInputBlur: (field: string) => void;
  handleAddStop: () => void;
  handleRemoveStop: (index: number) => void;
  handleStopChange: (index: number, location: string) => void;
  handleStopDurationChange: (index: number, duration: number) => void;
  children: ReactNode;
}) {
  return (
    <>
              {/* Compact Booking Type Toggle */}
              <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs sm:text-sm font-medium mb-3">
                {(["destination", "hourly"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setBookingType(type)}
                    className={`flex-1 rounded-md px-2 py-1.5 sm:px-3 sm:py-2 transition-all duration-300 flex items-center justify-center gap-1.5 ${
                      formData.bookingType === type
                        ? "bg-gradient-to-r from-primary/80 to-primary text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                    }`}
                  >
                    {type === "destination" ? (
                      <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                    ) : (
                      <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                    )}
                    <span className="hidden xs:inline">
                      {type === "destination"
                        ? t("embeddable.destination")
                        : t("embeddable.hourly")}
                    </span>
                    <span className="xs:hidden">
                      {type === "destination" ? t('Step1.DestinationBased') : t('Step1.TimeBased')}
                    </span>
                  </button>
                ))}
              </div>

              {/* Compact Form Inputs */}
              <div className="space-y-2 sm:space-y-3">
                {/* Pickup Location */}
                <div className="relative">
                  <div className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-primary">
                    <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                  </div>
                  <Input
                    ref={pickupInputRef}
                    placeholder={t("embeddable.pickup-location")}
                    value={formData.pickup}
                    onChange={(e) => {
                      handleInputChange("pickup", e.target.value);
                    }}
                    onBlur={() => handleInputBlur("pickup")}
                    onFocus={() => setFocusedField("pickup")}
                    className={`rounded-lg border bg-white pl-7 sm:pl-9 md:pl-10 pr-2 sm:pr-3 py-2 sm:py-2.5 text-xs sm:text-sm transition-all duration-200 ${
                      errors.pickup
                        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                        : focusedField === "pickup"
                        ? "border-primary focus:border-primary focus:ring-primary/20"
                        : "border-slate-200 focus:border-primary focus:ring-primary/20"
                    }`}
                  />
                  {errors.pickup && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-red-500">
                      <AlertCircle className="h-3 w-3" />
                      <span className="truncate">{errors.pickup}</span>
                    </div>
                  )}
                </div>

                {/* Stops - Only for destination-based bookings */}
                {!isHourly && (
                  <div className="space-y-2">
                    {formData.stops.map((stop, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="flex-1 flex gap-2">
                          <div className="relative flex-[3]">
                            <div className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-primary pointer-events-none">
                              <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                            </div>
                            <Input
                              ref={(el) => {
                                if (stopInputRefs.current) {
                                  stopInputRefs.current[index] = el;
                                }
                              }}
                              placeholder={t('embeddable.stop-index-1-location', { 0: index + 1 })}
                              value={stop.location}
                              onChange={(e) =>
                                handleStopChange(index, e.target.value)
                              }
                              className="rounded-lg border bg-white pl-7 sm:pl-9 md:pl-10 pr-2 sm:pr-3 py-2 sm:py-2.5 text-xs sm:text-sm border-slate-200 hover:border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                            />
                          </div>
                          <div className="relative flex-1 min-w-[80px] sm:min-w-[90px]">
                            <div className="absolute left-1.5 sm:left-2 top-1/2 -translate-y-1/2 text-primary pointer-events-none z-10">
                              <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            </div>
                            <select
                              value={stop.duration || 0}
                              onChange={(e) => handleStopDurationChange(index, parseInt(e.target.value))}
                              className="w-full rounded-lg border bg-white pl-6 sm:pl-7 pr-6 sm:pr-7 py-2 sm:py-2.5 text-xs font-medium text-slate-700 border-slate-200 hover:border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200 cursor-pointer appearance-none"
                              style={{
                                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                backgroundPosition: 'right 0.25rem center',
                                backgroundRepeat: 'no-repeat',
                                backgroundSize: '1.15em 1.15em',
                              }}
                            >
                              {STOP_WAIT_OPTIONS_10_MIN.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveStop(index)}
                          className="flex-shrink-0 p-1 sm:p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
                        >
                          <X className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Dropoff Location */}
                {!isHourly && (
                  <div>
                    <div className="flex justify-end mb-1.5 w-full">
                      <button
                        type="button"
                        onClick={handleAddStop}
                        className="text-xs text-primary hover:text-primary/80 underline"
                      >
                        {t('embeddable.add-a-stop')} </button>
                    </div>
                    <div className="flex-1 relative">
                      <div className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-primary">
                        <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                      </div>
                      <Input
                        ref={dropoffInputRef}
                        placeholder={t("embeddable.destination")}
                        value={formData.dropoff}
                        onChange={(e) => {
                          handleInputChange("dropoff", e.target.value);
                        }}
                        onBlur={() => handleInputBlur("dropoff")}
                        onFocus={() => setFocusedField("dropoff")}
                        className={`rounded-lg border bg-white pl-7 sm:pl-9 md:pl-10 pr-2 sm:pr-3 py-2 sm:py-2.5 text-xs sm:text-sm transition-all duration-200 ${
                          errors.dropoff
                            ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                            : focusedField === "dropoff"
                            ? "border-primary focus:border-primary focus:ring-primary/20"
                            : "border-slate-200 focus:border-primary focus:ring-primary/20"
                        }`}
                      />
                    </div>
                    {errors.dropoff && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        <span className="truncate">{errors.dropoff}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Duration */}
                {isHourly && (
                  <div className="relative">
                    <div className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-primary">
                      <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                    </div>
                    <Input
                      type="number"
                      placeholder={t("embeddable.duration-hours")}
                      min={1}
                      value={formData.duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="rounded-lg border bg-white pl-7 sm:pl-9 md:pl-10 pr-2 sm:pr-3 py-2 sm:py-2.5 text-xs sm:text-sm border-slate-200 focus:border-primary focus:ring-primary/20 transition-all duration-200"
                    />
                  </div>
                )}

                {/* Compact One-way / Round-trip Toggle */}
                {!isHourly && (
                  <div className="flex rounded-lg border bg-slate-200 p-1 text-xs sm:text-sm font-medium">
                    <button
                      type="button"
                      onClick={() => setTripType("oneway")}
                      className={`flex-1 rounded-md px-2 py-1.5 sm:px-3 sm:py-2 transition-all duration-300 flex items-center justify-center gap-1.5 ${
                        formData.tripType === "oneway"
                          ? "bg-white shadow-sm text-slate-800"
                          : "text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                      }`}
                    >
                      <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                      <span className="hidden xs:inline">{t("embeddable.one-way")}</span>
                      <span className="xs:hidden">One-way</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTripType("roundtrip")}
                      className={`flex-1 rounded-md px-2 py-1.5 sm:px-3 sm:py-2 transition-all duration-300 flex items-center justify-center gap-1.5 ${
                        formData.tripType === "roundtrip"
                          ? "bg-white shadow-sm text-slate-800"
                          : "text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                      }`}
                    >
                      <RefreshCw className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                      <span className="hidden xs:inline">{t("embeddable.round-trip")}</span>
                      <span className="xs:hidden">{t('embeddable.round')}</span>
                    </button>
                  </div>
                )}
                {children}
              </div>
    </>
  );
}
