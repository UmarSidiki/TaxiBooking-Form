"use client";

import { Input } from "@/components/ui/input";
import type { FormData, FormErrors } from "@/contexts/BookingFormContext";
import { STOP_WAIT_OPTIONS_10_MIN } from "@/lib/form/stop-wait-duration-options";
import { AlertCircle, Clock, MapPin, Plus, X } from "lucide-react";
import type { useTranslations } from "next-intl";
import type { MutableRefObject, RefObject } from "react";

type TFn = ReturnType<typeof useTranslations>;

export function EmbeddableV3LocationFields({
  t,
  formData,
  errors,
  isHourly,
  pickupInputRef,
  dropoffInputRef,
  stopInputRefs,
  handleInputChange,
  handleInputBlur,
  handleAddStop,
  handleRemoveStop,
  handleStopChange,
  handleStopDurationChange,
}: {
  t: TFn;
  formData: FormData;
  errors: FormErrors;
  isHourly: boolean;
  pickupInputRef: RefObject<HTMLInputElement | null>;
  dropoffInputRef: RefObject<HTMLInputElement | null>;
  stopInputRefs: MutableRefObject<Array<HTMLInputElement | null>>;
  handleInputChange: (field: string, value: string | number) => void;
  handleInputBlur: (field: string) => void;
  handleAddStop: () => void;
  handleRemoveStop: (index: number) => void;
  handleStopChange: (index: number, location: string) => void;
  handleStopDurationChange: (index: number, duration: number) => void;
}) {
  return (
    <>
            {/* Pickup Location */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                {t("embeddable.pickup-location")} *
              </label>
              <div className="relative">
                <div className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-primary">
                  <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
                <Input
                  ref={pickupInputRef}
                  placeholder={t("embeddable.pickup-location")}
                  value={formData.pickup}
                  onChange={(e) => {
                    handleInputChange("pickup", e.target.value);
                  }}
                  onBlur={() => handleInputBlur("pickup")}
                  className={`rounded-lg border bg-white pl-8 sm:pl-10 pr-2 sm:pr-3 py-2 sm:py-2.5 text-xs sm:text-sm transition-all duration-200 ${
                    errors.pickup
                      ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                      : "border-gray-300 focus:border-primary focus:ring-primary/20"
                  }`}
                />
              </div>
              {errors.pickup && (
                <div className="flex items-center gap-1 mt-1 text-xs text-red-500">
                  <AlertCircle className="h-3 w-3" />
                  <span className="truncate">{errors.pickup}</span>
                </div>
              )}
            </div>

            {/* Stops - Only for destination-based bookings */}
            {!isHourly && formData.stops.length > 0 && (
              <div className="space-y-2">
                {formData.stops.map((stop, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex-1 flex gap-2">
                      <div className="relative flex-[3]">
                        <div className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-primary pointer-events-none">
                          <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
                          className="rounded-lg border bg-white pl-8 sm:pl-10 pr-2 sm:pr-3 py-2 sm:py-2.5 text-xs sm:text-sm border-gray-300 hover:border-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                        />
                      </div>
                      <div className="relative flex-1 min-w-[80px] sm:min-w-[90px]">
                        <div className="absolute left-1.5 sm:left-2 top-1/2 -translate-y-1/2 text-primary pointer-events-none z-10">
                          <Clock className="h-3.5 w-3.5" />
                        </div>
                        <select
                          value={stop.duration || 0}
                          onChange={(e) => handleStopDurationChange(index, parseInt(e.target.value))}
                          className="w-full rounded-lg border bg-white pl-6 sm:pl-7 pr-6 sm:pr-7 py-2 sm:py-2.5 text-xs font-medium text-gray-700 border-gray-300 hover:border-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all duration-200 cursor-pointer appearance-none"
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
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
                      className="flex-shrink-0 p-1.5 sm:p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
                    >
                      <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Dropoff Location - Only for destination-based bookings */}
            {!isHourly && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs sm:text-sm font-medium text-gray-700">
                    {t("embeddable.destination")} *
                  </label>
                  <button
                    type="button"
                    onClick={handleAddStop}
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    <span className="hidden sm:inline">{t('embeddable.add-a-stop')}</span>
                    <span className="sm:hidden">+</span>
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-primary">
                    <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                  <Input
                    ref={dropoffInputRef}
                    placeholder={t("embeddable.destination")}
                    value={formData.dropoff}
                    onChange={(e) => {
                      handleInputChange("dropoff", e.target.value);
                    }}
                    onBlur={() => handleInputBlur("dropoff")}
                    className={`rounded-lg border bg-white pl-8 sm:pl-10 pr-2 sm:pr-3 py-2 sm:py-2.5 text-xs sm:text-sm transition-all duration-200 ${
                      errors.dropoff
                        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                        : "border-gray-300 focus:border-primary focus:ring-primary/20"
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

            {/* Duration - Only for hourly bookings */}
            {isHourly && (
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  {t("embeddable.duration-hours")} *
                </label>
                <div className="relative">
                  <div className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-primary">
                    <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                  <Input
                    type="number"
                    placeholder={t("embeddable.duration-hours")}
                    min={1}
                    value={formData.duration}
                    onChange={(e) =>
                      handleInputChange("duration", Number(e.target.value))
                    }
                    className="rounded-lg border bg-white pl-8 sm:pl-10 pr-2 sm:pr-3 py-2 sm:py-2.5 text-xs sm:text-sm border-gray-300 focus:border-primary focus:ring-primary/20 transition-all duration-200"
                  />
                </div>
              </div>
            )}
    </>
  );
}
