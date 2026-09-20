"use client";

import { Card } from "@/shared/ui/card";
import type { DistanceData, FormData } from "@/features/booking/context/booking-form-context";
import {
  CalendarDays,
  Clock,
  Loader2,
  MapPin,
  Users,
} from "lucide-react";
import type { useTranslations } from "next-intl";
import type { RefObject } from "react";

type TFn = ReturnType<typeof useTranslations>;

export function Step1MapPanel({
  t,
  mapRef,
  mapLoaded,
  distanceData,
  formData,
}: {
  t: TFn;
  mapRef: RefObject<HTMLDivElement | null>;
  mapLoaded: boolean;
  distanceData: DistanceData | null;
  formData: FormData;
}) {
  return (
    <>
      {/* Map Section - Left Side */}
      <div className="lg:col-span-3 max-sm:order-2">
        <Card className="h-full min-h-[500px] lg:min-h-[600px] overflow-hidden border-0 shadow-none">
          <div className="relative w-full h-full bg-white p-3">
            <div ref={mapRef} className="w-full h-full" />
            {!mapLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {/* Distance Info Overlay */}
            {distanceData && (
              <div className="absolute top-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs text-gray-500">
                        {t("Step1.Distance")}
                      </p>
                      <p className="font-semibold">
                        {distanceData.distance.text}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs text-gray-500">
                        {t("Step1.Duration")}
                      </p>
                      <p className="font-semibold">
                        {distanceData.duration.text}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs text-gray-500">{t("Step1.Date")}</p>
                      <p className="font-semibold">
                        {formData.date || t("not-set")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs text-gray-500">
                        {t("Step1.Passengers")}
                      </p>
                      <p className="font-semibold">{formData.passengers}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
