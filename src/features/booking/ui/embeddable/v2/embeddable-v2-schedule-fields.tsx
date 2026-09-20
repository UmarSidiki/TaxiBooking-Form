"use client";

import { Input } from "@/components/ui/input";
import type { FormData, FormErrors } from "@/contexts/BookingFormContext";
import {
  MAX_PASSENGERS,
  MIN_PASSENGERS,
} from "@/lib/form/passenger-limits";
import { AlertCircle, Calendar, Clock, Users } from "lucide-react";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations>;

export function EmbeddableV2ScheduleFields({
  t,
  formData,
  errors,
  minDate,
  handleInputChange,
  handleInputBlur,
  setPassengers,
}: {
  t: TFn;
  formData: FormData;
  errors: FormErrors;
  minDate: string;
  handleInputChange: (field: string, value: string | number) => void;
  handleInputBlur: (field: string) => void;
  setPassengers: (passengers: number) => void;
}) {
  return (
    <>
                {/* Compact Date and Time */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <div className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-primary">
                      <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                    </div>
                    <Input
                      type="date"
                      value={formData.date}
                      min={minDate}
                      onChange={(e) =>
                        handleInputChange("date", e.target.value)
                      }
                      className={`rounded-lg border bg-white pl-7 sm:pl-9 md:pl-10 pr-2 sm:pr-3 py-2 sm:py-2.5 text-xs sm:text-sm transition-all duration-200 ${
                        errors.date
                          ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                          : "border-slate-200 focus:border-primary focus:ring-primary/20"
                      }`}
                    />
                    {errors.date && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        <span className="truncate">{errors.date}</span>
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-primary">
                      <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                    </div>
                    <Input
                      type="time"
                      value={formData.time}
                      onChange={(e) =>
                        handleInputChange("time", e.target.value)
                      }
                      className={`rounded-lg border bg-white pl-7 sm:pl-9 md:pl-10 pr-2 sm:pr-3 py-2 sm:py-2.5 text-xs sm:text-sm transition-all duration-200 ${
                        errors.time
                          ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                          : "border-slate-200 focus:border-primary focus:ring-primary/20"
                      }`}
                    />
                    {errors.time && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        <span className="truncate">{errors.time}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Passengers */}
                <div className="relative">
                  <div className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-primary">
                    <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                  </div>
                  <Input
                    type="number"
                    placeholder={t("embeddable.passengers")}
                    value={formData.passengers}
                    max={String(MAX_PASSENGERS)}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow empty string for clearing
                      if (value === "") {
                        handleInputChange("passengers", "");
                        return;
                      }
                      // Convert to number and validate
                      const numValue = Number(value);
                      if (!isNaN(numValue) && numValue >= 0) {
                        setPassengers(numValue);
                      }
                    }}
                    onBlur={() => {
                      // On blur, ensure we have at least 1 passenger
                      if (Number(formData.passengers) < MIN_PASSENGERS) {
                        handleInputChange("passengers", MIN_PASSENGERS);
                      }
                      handleInputBlur("passengers");
                    }}
                    className={`rounded-lg border bg-white pl-7 sm:pl-9 md:pl-10 pr-2 sm:pr-3 py-2 sm:py-2.5 text-xs sm:text-sm border-slate-200 focus:border-primary focus:ring-primary/20 transition-all duration-200 ${
                      errors.passengers
                        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                        : "border-slate-200 focus:border-primary focus:ring-primary/20"
                    }`}
                  />
                  {errors.passengers && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-red-500">
                      <AlertCircle className="h-3 w-3" />
                      <span className="truncate">{errors.passengers}</span>
                    </div>
                  )}
                </div>
    </>
  );
}
