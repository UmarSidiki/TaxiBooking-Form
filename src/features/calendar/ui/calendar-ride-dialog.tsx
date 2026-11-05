"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { Car, Plane, UserRound, Users } from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Link } from "@/shared/i18n/navigation";
import type { CalendarRide } from "@/features/calendar/ui/calendar-types";

function formatWhen(ride: CalendarRide, locale: string) {
  const instant = new Date(`${ride.date}T${ride.time || "00:00"}:00Z`);
  if (Number.isNaN(instant.getTime())) return `${ride.date} · ${ride.time}`;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(instant);
}

function statusLabel(
  status: string | undefined,
  keys: Record<string, string>,
) {
  if (!status) return null;
  return keys[status] ?? status;
}

export function CalendarRideDialog({
  ride,
  onClose,
}: {
  ride: CalendarRide | null;
  onClose: () => void;
}) {
  const t = useTranslations("Calendar");
  const locale = useLocale();
  const pathname = usePathname();
  const isAdmin = pathname.includes("/dashboard");
  const isPartner = pathname.includes("/partners");

  const status = statusLabel(ride?.status, {
    upcoming: t("status-upcoming"),
    completed: t("status-completed"),
    canceled: t("status-canceled"),
    requested: t("status-requested"),
    awaiting_payment: t("status-awaiting-payment"),
  });
  const driverStatus = statusLabel(ride?.driverRideStatus, {
    assigned: t("driver-status-assigned"),
    on_the_way: t("driver-status-on-the-way"),
    arrived: t("driver-status-arrived"),
    completed: t("driver-status-completed"),
  });
  const assignee =
    ride?.assignedDriver?.name || ride?.assignedPartner?.name || t("unassigned");

  return (
    <Dialog open={Boolean(ride)} onOpenChange={(open) => (open ? null : onClose())}>
      <DialogContent className="w-[95vw] sm:w-full sm:max-w-md">
        {ride ? (
          <>
            <DialogHeader>
              <DialogTitle className="break-words">
                {ride.pickup}
                {ride.dropoff ? ` → ${ride.dropoff}` : ""}
              </DialogTitle>
              <DialogDescription>
                {t("trip")} #{ride.tripId} · {formatWhen(ride, locale)}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-wrap gap-2">
              {status ? <Badge variant="secondary">{status}</Badge> : null}
              {driverStatus ? <Badge variant="outline">{driverStatus}</Badge> : null}
              <Badge variant="outline">
                {ride.bookingType === "hourly"
                  ? `${t("hourly")}${ride.duration ? ` · ${t("duration-hours", { count: ride.duration })}` : ""}`
                  : t("destination")}
              </Badge>
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div className="flex items-start gap-2">
                <Car className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                <div>
                  <dt className="text-xs text-muted-foreground">{t("vehicle")}</dt>
                  <dd className="font-medium">{ride.vehicleDetails?.name || "—"}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Users className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                <div>
                  <dt className="text-xs text-muted-foreground">{t("passengers")}</dt>
                  <dd className="font-medium">{ride.passengers ?? "—"}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <UserRound className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                <div>
                  <dt className="text-xs text-muted-foreground">
                    {ride.assignedPartner?.name ? t("partner") : t("driver")}
                  </dt>
                  <dd className="font-medium break-words">{assignee}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Plane className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                <div>
                  <dt className="text-xs text-muted-foreground">{t("flight")}</dt>
                  <dd className="font-medium">{ride.flightNumber || "—"}</dd>
                </div>
              </div>
            </dl>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                {t("close")}
              </Button>
              <Button asChild>
                <Link
                  href={
                    isAdmin
                      ? `/dashboard/rides?bookingId=${encodeURIComponent(ride._id)}`
                      : isPartner
                        ? "/partners/rides"
                        : "/drivers/dashboard"
                  }
                >
                  {isAdmin || isPartner ? t("open-ride") : t("open-dashboard")}
                </Link>
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
