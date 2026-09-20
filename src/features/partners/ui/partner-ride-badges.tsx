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
    return <Badge variant="destructive">{t("canceled")}</Badge>;
  }
  if (isPassed) {
    return <Badge variant="secondary">{t("completed")}</Badge>;
  }
  return <Badge>{t("upcoming")}</Badge>;
}

export function PartnerRidePaymentBadge({
  status,
  tRides,
}: {
  status: string;
  tRides: TFn;
}) {
  switch (status) {
    case "completed":
    case "paid":
      return (
        <Badge className="gap-1">
          <CheckCircle className="size-3" /> {tRides("Paid")}
        </Badge>
      );
    case "pending":
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="size-3" /> {tRides("Pending")}
        </Badge>
      );
    case "refunded":
      return (
        <Badge variant="outline" className="gap-1">
          <RefreshCw className="size-3" /> {tRides("Refunded")}
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="destructive" className="gap-1">
          <X className="size-3" /> {tRides("Failed")}
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}
