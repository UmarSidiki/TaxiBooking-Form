"use client";

import { BookingPaymentIcons } from "@/features/booking/ui/booking-payment-icons";
import { Button } from "@/shared/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations>;

export function Step1Footer({
  t,
  isLoading,
  calculatingDistance,
  handleNext,
}: {
  t: TFn;
  isLoading: boolean;
  calculatingDistance: boolean;
  handleNext: () => void;
}) {
  return (
    <>
          {/* Next Button */}
          <Button
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-base rounded-lg"
            onClick={handleNext}
            disabled={isLoading || calculatingDistance}
          >
            {isLoading || calculatingDistance ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {t("Step1.Processing")}
              </>
            ) : (
              <>
                {t("Step1.ContinueToVehicleSelection")}
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>

          {/* Payment Icons */}
          <BookingPaymentIcons
            className="flex justify-center gap-2 flex-wrap pt-2"
            imageClassName="h-6 w-auto opacity-70"
          />

          {/* Support Info */}
          <div className="text-center text-xs text-gray-500 space-y-1 pt-2">
            <p>{t("Footer.Support2")}</p>
            <p className="flex items-center justify-center gap-2 flex-wrap">
              <span>{process.env.NEXT_PUBLIC_PHONE_NUMBER}</span>
              <span>•</span>
              <span>{process.env.NEXT_PUBLIC_SUPPORT_EMAIL}</span>
            </p>
          </div>
    </>
  );
}
