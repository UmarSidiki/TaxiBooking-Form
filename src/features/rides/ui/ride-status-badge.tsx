import { Calendar, CheckCircle, Clock, Inbox, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { IBooking } from "@/features/booking/model";
import { StatusMark } from "@/features/dashboard/ui/riviera/status-mark";

type RideStatusBadgeProps = {
  booking: Pick<IBooking, "status" | "date">;
  isCompleted?: boolean;
};

export function RideStatusBadge({ booking, isCompleted }: RideStatusBadgeProps) {
  const t = useTranslations();

  if (booking.status === "canceled") {
    return <StatusMark tone="err" label={t("Dashboard.Rides.Canceled")} />;
  }

  if (booking.status === "requested") {
    return <StatusMark tone="info" label={t("Dashboard.Rides.status-requested")} />;
  }

  if (booking.status === "awaiting_payment") {
    return <StatusMark tone="info" label={t("Dashboard.Rides.status-awaiting-payment")} />;
  }

  const completed =
    isCompleted ??
    (booking.status === "completed" || new Date(booking.date) < new Date());

  if (completed || booking.status === "completed") {
    return <StatusMark tone="ok" label={t("Dashboard.Rides.Completed")} />;
  }

  return <StatusMark tone="info" label={t("Dashboard.Rides.Upcoming")} />;
}