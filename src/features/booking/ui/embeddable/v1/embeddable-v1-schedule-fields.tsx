"use client";

import { Input } from "@/components/ui/input";
import type { FormData, FormErrors } from "@/contexts/BookingFormContext";
import {
  MAX_PASSENGERS,
  MIN_PASSENGERS,
} from "@/lib/form/passenger-limits";
import { AlertCircle, Users } from "lucide-react";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations>;

export function EmbeddableV1ScheduleFields({
  t,
  formData,
  errors,
  isHourly,
  minDate,
  handleInputChange,
  handleInputBlur,
  setPassengers,
}: {
  t: TFn;
  formData: FormData;
  errors: FormErrors;
  isHourly: boolean;
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
                    <Input
                      type="date"
                      value={formData.date}
                      min={minDate}
                      onChange={(e) =>
                        handleInputChange("date", e.target.value)
                      }
                      placeholder={
                        formData.tripType === "roundtrip"
                          ? t("embeddable.departure-date")
                          : t("embeddable.date")
                      }
                      className={`rounded-lg border bg-white pl-9 md:pl-10 pr-3 py-2 md:py-2.5 text-sm transition-all duration-200 ${
                        errors.date
                          ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                          : "border-slate-200 focus:border-primary focus:ring-primary/20"
                      }`}
                    />
                    {errors.date && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        {errors.date}
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      type="time"
                      value={formData.time}
                      onChange={(e) =>
                        handleInputChange("time", e.target.value)
                      }
                      placeholder={
                        formData.tripType === "roundtrip"
                          ? t("embeddable.departure-time")
                          : t("embeddable.time")
                      }
                      className={`rounded-lg border bg-white pl-9 md:pl-10 pr-3 py-2 md:py-2.5 text-sm transition-all duration-200 ${
                        errors.time
                          ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                          : "border-slate-200 focus:border-primary focus:ring-primary/20"
                      }`}
                    />
                    {errors.time && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        {errors.time}
                      </div>
                    )}
                  </div>
                </div>

                {/* Return Date and Time - Only for roundtrip */}
                {formData.tripType === "roundtrip" && !isHourly && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <Input
                        type="date"
                        value={formData.returnDate}
                        min={formData.date || minDate}
                        onChange={(e) =>
                          handleInputChange("returnDate", e.target.value)
                        }
                        placeholder={t("embeddable.return-date")}
                        className={`rounded-lg border bg-white pl-9 md:pl-10 pr-3 py-2 md:py-2.5 text-sm transition-all duration-200 ${
                          errors.returnDate
                            ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                            : "border-slate-200 focus:border-primary focus:ring-primary/20"
                        }`}
                      />
                      {errors.returnDate && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-red-500">
                          <AlertCircle className="h-3 w-3" />
                          {errors.returnDate}
                        </div>
                      )}
                    </div>
                    <div className="relative">
                      <Input
                        type="time"
                        value={formData.returnTime}
                        onChange={(e) =>
                          handleInputChange("returnTime", e.target.value)
                        }
                        placeholder={t("embeddable.return-time")}
                        className={`rounded-lg border bg-white pl-9 md:pl-10 pr-3 py-2 md:py-2.5 text-sm transition-all duration-200 ${
                          errors.returnTime
                            ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                            : "border-slate-200 focus:border-primary focus:ring-primary/20"
                        }`}
                      />
                      {errors.returnTime && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-red-500">
                          <AlertCircle className="h-3 w-3" />
                          {errors.returnTime}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Passengers */}
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary">
                    <Users className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  </div>
                  <Input
                    type="number"
                    placeholder={t("embeddable.passengers")}
                    value={formData.passengers === 0 ? "" : formData.passengers}
                    min={String(MIN_PASSENGERS)}
                    max={String(MAX_PASSENGERS)}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow empty string for clearing
                      if (value === "") {
                        setPassengers(0);
                        return;
                      }
                      // Convert to number and validate
                      const numValue = Number(value);
                      if (!isNaN(numValue) && numValue >= MIN_PASSENGERS && numValue <= MAX_PASSENGERS) {
                        setPassengers(numValue);
                      }
                    }}
                    onBlur={() => {
                      // On blur, ensure we have at least 1 passenger
                      const currentValue = Number(formData.passengers);
                      if (isNaN(currentValue) || currentValue < MIN_PASSENGERS) {
                        handleInputChange("passengers", MIN_PASSENGERS);
                      }
                      handleInputBlur("passengers");
                    }}
                    className={`rounded-lg border bg-white pl-9 md:pl-10 pr-3 py-2 md:py-2.5 text-sm border-slate-200 focus:border-primary focus:ring-primary/20 transition-all duration-200 ${
                      errors.passengers
                        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                        : "border-slate-200 focus:border-primary focus:ring-primary/20"
                    }`}
                  />
                  {errors.passengers && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-red-500">
                      <AlertCircle className="h-3 w-3" />
                      {errors.passengers}
                    </div>
                  )}
                </div>
    </>
  );
}
