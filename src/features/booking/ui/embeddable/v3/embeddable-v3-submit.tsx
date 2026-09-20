"use client";

import { Button } from "@/components/ui/button";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations>;

export function EmbeddableV3Submit({
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
            <Button
              type="submit"
              className="w-full rounded-lg py-2 sm:py-3 text-xs sm:text-sm font-semibold text-white transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed bg-gradient-to-r from-primary via-primary/90 to-primary/70 hover:from-primary/95 hover:via-primary/85 hover:to-primary/65"
              disabled={isLoading || calculatingDistance}
            >
              {isLoading || calculatingDistance ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                t("embeddable.search")
              )}
            </Button>
          </div>
  );
}
