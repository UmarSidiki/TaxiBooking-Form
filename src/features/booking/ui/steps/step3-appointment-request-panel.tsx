"use client";

import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { CalendarClock, Loader2 } from "lucide-react";
import type { useTranslations } from "next-intl";

export function Step3AppointmentRequestPanel({
  t,
  currencySymbol,
  totalPrice,
  isLoading,
  onSubmit,
}: {
  t: ReturnType<typeof useTranslations>;
  currencySymbol: string;
  totalPrice: number;
  isLoading: boolean;
  onSubmit: () => void;
}) {
  return (
    <Card className="p-5 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <CalendarClock className="size-5 text-primary mt-0.5" aria-hidden />
        <div className="flex flex-col gap-1 min-w-0">
          <h3 className="font-semibold text-lg">
            {t("Step3.appointment-request-title")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t("Step3.appointment-request-help")}
          </p>
        </div>
      </div>
      <p className="text-sm">
        {t("Step3.indicative-rate-label")}{" "}
        <span className="font-semibold tabular-nums">
          {currencySymbol}
          {totalPrice.toFixed(2)}
        </span>
      </p>
      <Button
        type="button"
        className="min-h-11 w-full"
        disabled={isLoading || totalPrice <= 0}
        onClick={onSubmit}
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin" data-icon="inline-start" />
            {t("Step3.submitting-request")}
          </>
        ) : (
          t("Step3.request-this-appointment")
        )}
      </Button>
    </Card>
  );
}
