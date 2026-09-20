"use client";

import type { DistanceData, FormData } from "@/contexts/BookingFormContext";
import { Calendar, Clock, Flag, MapPin, Users } from "lucide-react";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations>;

export function Step2TripRoute({
  formData,
  distanceData,
  t,
}: {
  formData: FormData;
  distanceData: DistanceData | null;
  t: TFn;
}) {
  return (
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
                    {t("Step2.departure")}:{" "}
                    {formData.date || t("Step2.date-not-set")} at{" "}
                    {formData.time || t("Step2.time-not-set")}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-600" />
                  <span className="text-gray-700">
                    {t("Step2.return")}: {formData.returnDate} at{" "}
                    {formData.returnTime}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-600" />
                <span className="text-gray-700">
                  {formData.date || t("Step2.date-not-set")} at{" "}
                  {formData.time || t("Step2.time-not-set")}
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
  );
}
