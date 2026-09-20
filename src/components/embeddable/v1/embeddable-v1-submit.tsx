"use client";

import { BookingPaymentIcons } from "@/components/form/booking-payment-icons";
import { Button } from "@/components/ui/button";
import { ArrowRight, Car } from "lucide-react";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations>;

export function EmbeddableV1Submit({
  t,
  isLoading,
  calculatingDistance,
}: {
  t: TFn;
  isLoading: boolean;
  calculatingDistance: boolean;
}) {
  return (
            <div className="mt-auto">
              {/* Animated Submit Button */}
              <Button
                type="submit"
                className="w-full rounded-lg bg-primary py-2 md:py-2.5 text-sm font-semibold tracking-wide text-white hover:bg-primary/90 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                disabled={isLoading || calculatingDistance}
              >
                {isLoading || calculatingDistance ? (
                  <div className="taxi-animation-container w-full">
                    {/* Road/Path */}
                    <div className="taxi-road"></div>

                    {/* Taxi Icon */}
                    <div className="flex items-center justify-center h-full">
                      <Car className="h-5 w-5 md:h-6 md:w-6 taxi-icon text-white" />
                    </div>

                    {/* Loading dots below taxi */}
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex gap-1">
                      <span className="w-1 h-1 bg-white rounded-full loading-dot"></span>
                      <span className="w-1 h-1 bg-white rounded-full loading-dot"></span>
                      <span className="w-1 h-1 bg-white rounded-full loading-dot"></span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    {t("embeddable.search")}
                    <ArrowRight className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  </div>
                )}
              </Button>
              <div>
                <p className="text-xs text-center text-slate-500 mt-3">
                  {t(
                    "embeddable.by-submitting-my-data-i-agree-to-be-contacted"
                  )}{" "}
                </p>
              </div>
              <BookingPaymentIcons
                className="flex justify-center gap-2 flex-wrap pt-2"
                imageClassName="h-6 w-auto opacity-70"
              />
            </div>
  );
}
