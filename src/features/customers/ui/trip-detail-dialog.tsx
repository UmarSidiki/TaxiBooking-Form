"use client";

import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Badge } from "@/shared/ui/badge";
import type { Ride } from "./account-types";

const TIMELINE = ["booked", "assigned", "on-the-way", "arrived", "completed"] as const;

function stepIndex(ride: Ride): number {
  const d = ride.driverRideStatus;
  const status = ride.status;
  if (status === "completed" || d === "completed") return 5;
  if (d === "arrived") return 4;
  if (d === "started") return 3;
  if (d === "assigned" || ride.assignedDriver || ride.assignedPartner) return 2;
  return 1;
}

export function TripDetailDialog({
  open,
  onOpenChange,
  ride,
  t,
  locale,
  onChange,
  onCancel,
  settings,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  ride: Ride | null;
  t: (k: string) => string;
  locale: string;
  onChange: () => void;
  onCancel: () => void;
  settings: any;
}) {
  if (!ride) return null;
  const completed = stepIndex(ride);
  const mapUrl = ride.dropoff
    ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(ride.pickup)}&destination=${encodeURIComponent(ride.dropoff)}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ride.pickup)}`;

  const modifiable = ["requested", "awaiting_payment", "upcoming"].includes(ride.status ?? "") && (ride.date >= new Date().toISOString().slice(0, 10));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{ride.pickup} → {ride.dropoff || t("hourly")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div>
            <p>{ride.date} {ride.time}</p>
            {typeof ride.totalAmount === "number" ? <p>{t("total")}: {ride.totalAmount.toFixed(2)}</p> : null}
            <p>{t("passengers")}: {ride.passengers ?? 1}</p>
            {ride.vehicleDetails?.name ? <p>{t("vehicle")}: {ride.vehicleDetails.name}</p> : null}
          </div>

          <div>
            <p className="font-medium mb-2">{t("status-timeline")}</p>
            <ol className="space-y-1">
              {TIMELINE.map((step, i) => {
                const done = completed >= i + 1;
                return (
                  <li key={step} className="flex items-center gap-2">
                    <span className={`inline-block h-3 w-3 rounded-full ${done ? "bg-primary" : "bg-muted"}`} />
                    <span className={done ? "font-medium" : "text-muted-foreground"}>{t(`tl-${step}`)}</span>
                  </li>
                );
              })}
            </ol>
          </div>

          {ride.assignedDriver ? (
            <div>
              <p className="font-medium">{t("driver")}</p>
              <p>{ride.assignedDriver.name}</p>
              {ride.assignedDriver.email ? <p className="text-muted-foreground">{ride.assignedDriver.email}</p> : null}
            </div>
          ) : null}
          {ride.assignedPartner && !ride.assignedDriver ? (
            <div>
              <p className="font-medium">{t("partner")}</p>
              <p>{ride.assignedPartner.name}</p>
            </div>
          ) : null}

          <a className="inline-flex h-11 items-center rounded-md border border-border px-4" href={mapUrl} target="_blank" rel="noreferrer">{t("map-link")}</a>

          <div className="flex flex-wrap gap-2">
            {modifiable ? (
              <>
                <Button className="h-11" type="button" onClick={onChange}>{t("change")}</Button>
                <Button className="h-11" type="button" variant="destructive" onClick={onCancel}>{t("cancel")}</Button>
              </>
            ) : null}
            <a className="inline-flex h-11 items-center rounded-md border border-border px-4" href={`/api/invoice/${ride.tripId}`}>{t("invoice")}</a>
            <Button className="h-11" type="button" variant="outline" onClick={() => downloadIcs(ride, t)}>{t("add-calendar")}</Button>
            <a className="inline-flex h-11 items-center rounded-md border border-border px-4" href={rebookUrl(ride, locale)}>{t("rebook")}</a>
          </div>

          {(settings?.companyPhone || settings?.adminEmail) ? (
            <div className="space-y-1">
              <p className="font-medium">{t("contact-operator")}</p>
              {settings.companyPhone ? (
                <div className="flex flex-wrap gap-2">
                  <a className="inline-flex h-11 items-center rounded-md border border-border px-4" href={`tel:${settings.companyPhone}`}>{t("call")}</a>
                  <a className="inline-flex h-11 items-center rounded-md border border-border px-4" href={`https://wa.me/${settings.companyPhone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">{t("whatsapp")}</a>
                </div>
              ) : null}
              {settings.adminEmail ? (
                <a className="inline-flex h-11 items-center rounded-md border border-border px-4" href={`mailto:${settings.adminEmail}`}>{t("email")}</a>
              ) : null}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function rebookUrl(ride: Ride, locale: string) {
  const params = new URLSearchParams();
  if (ride.pickup) params.set("pickup", ride.pickup);
  if (ride.dropoff) params.set("dropoff", ride.dropoff);
  if (ride.date) params.set("date", ride.date);
  if (ride.time) params.set("time", ride.time);
  if (ride.passengers) params.set("passengers", String(ride.passengers));
  if (ride.bookingType) params.set("bookingType", ride.bookingType);
  if (ride.duration) params.set("duration", String(ride.duration));
  return `/${locale}?${params.toString()}`;
}

function downloadIcs(ride: Ride, t: (k: string) => string) {
  const start = `${ride.date}T${ride.time}:00`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//booking//EN",
    "BEGIN:VEVENT",
    `UID:${ride.tripId}@booking`,
    `DTSTART:${start.replace(/[-:]/g, "").slice(0, 15)}`,
    `SUMMARY:${ride.pickup} to ${ride.dropoff || "Hourly"}`,
    `DESCRIPTION:${ride.tripId}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${ride.tripId}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}