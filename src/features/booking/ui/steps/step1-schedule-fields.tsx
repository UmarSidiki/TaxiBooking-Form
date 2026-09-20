"use client";

import { Input } from "@/components/ui/input";
import type { FormData, FormErrors } from "@/contexts/BookingFormContext";
import type { useTranslations } from "next-intl";
import { MAX_PASSENGERS, MIN_PASSENGERS } from "@/lib/form/passenger-limits";
import { CalendarDays, Clock, Users } from "lucide-react";
import type { ChangeEvent } from "react";

type TFn = ReturnType<typeof useTranslations>;

export function Step1ScheduleFields({
  t,
  formData,
  errors,
  handleInputChange,
  handleInputBlur,
  handlePassengerChange,
  handlePassengerBlur,
  today,
}: {
  t: TFn;
  formData: FormData;
  errors: FormErrors;
  handleInputChange: (field: string, value: string | number) => void;
  handleInputBlur: (field: string) => void;
  handlePassengerChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handlePassengerBlur: () => void;
  today: string;
}) {
  return (
    <>
          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700">
                <CalendarDays className="inline h-4 w-4 mr-1" />
                {formData.tripType === "roundtrip"
                  ? t("Step1.DepartureDate")
                  : t("Step1.Date")}{" "}
                *
              </label>
              <Input
                type="date"
                min={today}
                className={`${
                  errors.date ? "border-red-500" : "border-gray-300"
                } focus:border-primary-500 focus:ring-primary-500`}
                value={formData.date}
                onChange={(e) => {
                  handleInputChange("date", e.target.value);
                }}
              />
              {errors.date && (
                <p className="text-red-500 text-xs mt-1">{errors.date}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-700">
                <Clock className="inline h-4 w-4 mr-1" />
                {formData.tripType === "roundtrip"
                  ? t("Step1.DepartureTime")
                  : t("Step1.Time")}{" "}
                *
              </label>
              <Input
                type="time"
                className={`${
                  errors.time ? "border-red-500" : "border-gray-300"
                } focus:border-primary-500 focus:ring-primary-500`}
                value={formData.time}
                onChange={(e) => {
                  handleInputChange("time", e.target.value);
                }}
              />
              {errors.time && (
                <p className="text-red-500 text-xs mt-1">{errors.time}</p>
              )}
            </div>
          </div>

          {/* Return Date & Time - Only for roundtrip */}
          {formData.tripType === "roundtrip" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700">
                  <CalendarDays className="inline h-4 w-4 mr-1" />
                  {t("Step1.ReturnDate")} *
                </label>
                <Input
                  type="date"
                  min={formData.date || today}
                  className={`${
                    errors.returnDate ? "border-red-500" : "border-gray-300"
                  } focus:border-primary-500 focus:ring-primary-500`}
                  value={formData.returnDate}
                  onChange={(e) => {
                    handleInputChange("returnDate", e.target.value);
                  }}
                />
                {errors.returnDate && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.returnDate}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700">
                  <Clock className="inline h-4 w-4 mr-1" />
                  {t("Step1.ReturnTime")} *
                </label>
                <Input
                  type="time"
                  className={`${
                    errors.returnTime ? "border-red-500" : "border-gray-300"
                  } focus:border-primary-500 focus:ring-primary-500`}
                  value={formData.returnTime}
                  onChange={(e) => {
                    handleInputChange("returnTime", e.target.value);
                  }}
                />
                {errors.returnTime && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.returnTime}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Passengers */}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-gray-700">
              <Users className="inline h-4 w-4 mr-1" />
              {t("Step1.Passengers")}
            </label>
            <Input
              type="number"
              min={String(MIN_PASSENGERS)}
              max={String(MAX_PASSENGERS)}
              placeholder="1"
              className="border-gray-300 focus:border-primary-500 focus:ring-primary-500"
              value={formData.passengers === 0 ? "" : formData.passengers}
              onChange={handlePassengerChange}
              onBlur={handlePassengerBlur}
            />
          </div>

    </>
  );
}
