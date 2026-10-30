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
  const phone = process.env.NEXT_PUBLIC_PHONE_NUMBER;
  const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
  const linkClass =
    "inline-flex min-h-11 items-center rounded-sm hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

  return (
    <>
          {/* Next Button */}
          <Button
            className="btn-primary w-full py-6 text-base"
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
          <div className="space-y-1 pt-2 text-center text-sm text-foreground/80">
            <p>{t("Footer.Support2")}</p>
            <p className="flex items-center justify-center gap-2 flex-wrap">
              {phone ? (
                <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className={linkClass}>
                  {phone}
                </a>
              ) : null}
              {phone && email ? <span aria-hidden="true">•</span> : null}
              {email ? (
                <a href={`mailto:${email}`} className={linkClass}>
                  {email}
                </a>
              ) : null}
            </p>
          </div>
    </>
  );
}
