"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Car } from "lucide-react";
import type { useTranslations } from "next-intl";
import Image from "next/image";

type TFn = ReturnType<typeof useTranslations>;

export function EmbeddableV2Submit({
  t,
  isLoading,
  calculatingDistance,
}: {
  t: TFn;
  isLoading: boolean;
  calculatingDistance: boolean;
}) {
  return (
            <div className="mt-auto pt-2 sm:pt-3">
              {/* Animated Submit Button */}
              <Button
                type="submit"
                className="w-full rounded-lg bg-gradient-to-r from-primary via-primary/90 to-primary/70 hover:from-primary/95 hover:via-primary/85 hover:to-primary/65 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold tracking-wide text-white transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                disabled={isLoading || calculatingDistance}
              >
                {isLoading || calculatingDistance ? (
                  <div className="taxi-animation-container w-full">
                    {/* Road/Path */}
                    <div className="taxi-road"></div>

                    {/* Taxi Icon */}
                    <div className="flex items-center justify-center h-full">
                      <Car className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 taxi-icon text-white" />
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
                    <span className="hidden xs:inline">{t("embeddable.search")}</span>
                    <span className="xs:hidden">{t('embeddable.search')}</span>
                    <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                  </div>
                )}
              </Button>
              <div>
                <p className="text-xs text-center text-slate-500 mt-2 sm:mt-3">
                  {t('embeddable.by-submitting-my-data-i-agree-to-be-contacted')} </p>
              </div>
              <div className="flex justify-center gap-2 flex-wrap pt-2">
                <Image
                  src="/visa.webp"
                  alt="Visa"
                  width={30}
                  height={20}
                  className="h-4 sm:h-5 md:h-6 w-auto opacity-70"
                />
                <Image
                  src="/mastercard.webp"
                  alt="MasterCard"
                  width={30}
                  height={20}
                  className="h-4 sm:h-5 md:h-6 w-auto opacity-70"
                />
                <Image
                  src="/paypal.webp"
                  alt="PayPal"
                  width={30}
                  height={20}
                  className="h-4 sm:h-5 md:h-6 w-auto opacity-70"
                />
                <Image
                  src="/twint.webp"
                  alt="Twint"
                  width={30}
                  height={20}
                  className="h-4 sm:h-5 md:h-6 w-auto opacity-70"
                />
                <Image
                  src="/applepay.webp"
                  alt="Apple Pay"
                  width={30}
                  height={20}
                  className="h-4 sm:h-5 md:h-6 w-auto opacity-70"
                />
              </div>
            </div>
  );
}
