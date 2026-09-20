"use client";

import type { PartnerRideBooking } from "@/features/partners/ui/partner-ride.types";
import { Badge } from "@/shared/ui/badge";
import { CheckCircle, Clock, RefreshCw, X } from "lucide-react";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations>;

export function PartnerRideStatusBadge({
  booking,
  t,
  isPassed,
}: {
  booking: PartnerRideBooking;
  t: TFn;
  isPassed: boolean;
}) {
  if (booking.status === "canceled") {
    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        {t("canceled")}
      </Badge>
    );
  }

  if (isPassed) {
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        {t("completed")}
      </Badge>
    );
  }

  return (
    <Badge className="flex items-center gap-1 bg-primary">{t("upcoming")}</Badge>
  );
}

export function PartnerRidePaymentBadge({
  status,
  tRides,
}: {
  status: string;
  tRides: TFn;
}) {
  const badgeClasses =
    "text-white font-semibold flex items-center gap-1.5 px-3 py-1 rounded-full text-xs";
  switch (status) {
    case "completed":
    case "paid":
      return (
        <Badge className={`${badgeClasses} bg-primary hover:bg-primary/90`}>
          <CheckCircle className="w-3 h-3" /> {tRides("Paid")}
        </Badge>
      );
    case "pending":
      return (
        <Badge className={`${badgeClasses} bg-yellow-500 hover:bg-yellow-600`}>
          <Clock className="w-3 h-3" /> {tRides("Pending")}
        </Badge>
      );
    case "refunded":
      return (
        <Badge className={`${badgeClasses} bg-blue-500 hover:bg-blue-600`}>
          <RefreshCw className="w-3 h-3" /> {tRides("Refunded")}
        </Badge>
      );
    case "failed":
      return (
        <Badge className={`${badgeClasses} bg-destructive hover:bg-destructive/90`}>
          <X className="w-3 h-3" /> {tRides("Failed")}
        </Badge>
      );
    default:
      return (
        <Badge className={`${badgeClasses} bg-muted hover:bg-muted/90 text-muted-foreground`}>
          {status}
        </Badge>
      );
  }
}
