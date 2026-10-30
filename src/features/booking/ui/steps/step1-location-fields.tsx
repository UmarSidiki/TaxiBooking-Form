"use client";

import { Button } from "@/shared/ui/button";
import { addressInputProps } from "@/features/booking/lib/maps/place-autocomplete";
import { Input } from "@/shared/ui/input";
import type { FormData, FormErrors } from "@/features/booking/context/booking-form-context";
import { STOP_WAIT_OPTIONS_15_MIN } from "@/features/booking/lib/stop-wait-duration-options";
import type { useTranslations } from "next-intl";
import { Clock, Loader2, MapPin, X } from "lucide-react";
import { PickupCurrentLocationButton } from "@/features/booking/ui/steps/pickup-current-location-button";
import type { Dispatch, RefObject, SetStateAction } from "react";

type TFn = ReturnType<typeof useTranslations>;

export function Step1LocationFields({
  t,
  formData,
  setFormData,
  errors,
  pickupInputRef,
  dropoffInputRef,
  stopInputRefs,
  handleInputBlur,
  handleAddStop,
  handleRemoveStop,
  handleStopChange,
  handleStopDurationChange,
  calculatingDistance,
}: {
  t: TFn;
  formData: FormData;
  setFormData: Dispatch<SetStateAction<FormData>>;
  errors: FormErrors;
  pickupInputRef: RefObject<HTMLInputElement | null>;
  dropoffInputRef: RefObject<HTMLInputElement | null>;
  stopInputRefs: { current: Array<HTMLInputElement | null> };
  handleInputBlur: (field: string) => void;
  handleAddStop: () => void;
  handleRemoveStop: (index: number) => void;
  handleStopChange: (index: number, location: string) => void;
  handleStopDurationChange: (index: number, duration: number) => void;
  calculatingDistance: boolean;
}) {
  return (
    <>
          {/* Pickup Location */}
          <div>
            <label htmlFor="booking-pickup" className="mb-1.5 block text-sm font-medium text-foreground">
              {t("Step1.PickupLocation")} *
            </label>
            <div className="relative">
              <Input
                id="booking-pickup"
                {...addressInputProps}
                ref={pickupInputRef}
                placeholder={t("Step1.PickupPlaceholder")}
                className={`h-11 pe-12 ${
                  errors.pickup ? "border-[var(--err)]" : "border-[var(--rule2)]"
                } focus:border-[var(--ink)]-500 focus:ring-primary-500`}
                value={formData.pickup}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, pickup: e.target.value, pickupLatLng: null }));
                }}
                onBlur={() => {
                  if (formData.pickup && formData.dropoff) {
                    handleInputBlur("pickup");
                  }
                }}
              />
              <PickupCurrentLocationButton />
            </div>
            {errors.pickup && (
              <p className="text-[color:var(--err)] text-xs mt-1">{errors.pickup}</p>
            )}
          </div>

          {/* Stops - Only for destination-based bookings */}
          {formData.bookingType === "destination" && (
            <div className="space-y-2">
              {formData.stops.map((stop, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-1 flex gap-2">
                    <div className="relative flex-[3]">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary pointer-events-none" />
                      <Input
                        {...addressInputProps}
                        aria-label={`Stop ${index + 1} location`}
                        ref={(el) => {
                          stopInputRefs.current[index] = el;
                        }}
                        placeholder={`Stop ${index + 1} location`}
                        value={stop.location}
                        onChange={(e) =>
                          handleStopChange(index, e.target.value)
                        }
                        className="pl-10 pr-3 h-9 focus:border-[var(--ink)]-500 focus:ring-primary-500 transition-colors"
                      />
                    </div>
                    <div className="relative flex-1 min-w-[100px]">
                      <Clock className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-primary pointer-events-none z-10" />
                      <select
                        value={stop.duration || 0}
                        onChange={(e) =>
                          handleStopDurationChange(
                            index,
                            parseInt(e.target.value)
                          )
                        }
                        className="w-full h-9 pl-8 pr-2 rounded-md border border-input bg-background text-xs font-medium text-[color:var(--ink)] cursor-pointer hover:border-[var(--ink)]/50 focus:border-[var(--ink)] focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all appearance-none"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                          backgroundPosition: "right 0.25rem center",
                          backgroundRepeat: "no-repeat",
                          backgroundSize: "1.25em 1.25em",
                        }}
                      >
                        {STOP_WAIT_OPTIONS_15_MIN.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleRemoveStop(index)}
                    className="flex-shrink-0 h-9 w-9 hover:text-[color:var(--err)] hover:border-[var(--err)] transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Dropoff Location - Only for destination-based bookings */}
          {errors.stops && (
            <p role="alert" className="text-[color:var(--err)] text-xs">{errors.stops}</p>
          )}
          {formData.bookingType === "destination" && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="booking-dropoff" className="text-sm font-medium text-foreground">
                  {t("Step1.DropoffLocation")} *
                </label>
                <button
                  type="button"
                  onClick={handleAddStop}
                  className="inline-flex min-h-11 items-center text-sm text-[color:var(--link)] hover:underline"
                >
                  {t("embeddable.add-a-stop")}
                </button>
              </div>
              <Input
                id="booking-dropoff"
                {...addressInputProps}
                ref={dropoffInputRef}
                placeholder={t("Step1.DropoffPlaceholder")}
                className={`${
                  errors.dropoff ? "border-[var(--err)]" : "border-[var(--rule2)]"
                } focus:border-[var(--ink)]-500 focus:ring-primary-500`}
                value={formData.dropoff}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, dropoff: e.target.value, dropoffLatLng: null }));
                }}
                onBlur={() => {
                  if (formData.pickup && formData.dropoff) {
                    handleInputBlur("dropoff");
                  }
                }}
              />
              {errors.dropoff && (
                <p className="text-[color:var(--err)] text-xs mt-1">{errors.dropoff}</p>
              )}
              {calculatingDistance && (
                <p className="text-xs text-[color:var(--ink2)] mt-1 flex items-center">
                  <Loader2 className="inline h-3 w-3 animate-spin mr-1" />
                  {t("Step1.CalculatingDistance")}
                </p>
              )}
            </div>
          )}
    </>
  );
}
