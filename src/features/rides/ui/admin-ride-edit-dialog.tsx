"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import type { IBooking } from "@/features/booking/model";

export function AdminRideEditDialog({
  booking,
  open,
  onOpenChange,
  onSaved,
}: {
  booking: IBooking;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (notice: string) => void;
}) {
  const t = useTranslations();
  const [pickup, setPickup] = useState(booking.pickup);
  const [date, setDate] = useState(booking.date);
  const [time, setTime] = useState(booking.time);
  const [notes, setNotes] = useState(booking.notes ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/bookings/${booking._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "edit",
          edit: { pickup, date, time, notes },
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(
          data.message === "driver_time_off"
            ? t("Dashboard.Rides.driver-time-off")
            : t("Dashboard.Rides.edit-failed"),
        );
        return;
      }
      onSaved(t("Dashboard.Rides.edit-saved"));
      onOpenChange(false);
    } catch {
      setError(t("Dashboard.Rides.edit-failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("Dashboard.Rides.edit-ride")}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div>
            <Label htmlFor="edit-pickup">{t("Dashboard.Rides.PickupLocation")}</Label>
            <Input id="edit-pickup" className="h-11" value={pickup} onChange={(event) => setPickup(event.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="edit-date">{t("Dashboard.Rides.Date")}</Label>
              <Input id="edit-date" type="date" className="h-11" value={date} onChange={(event) => setDate(event.target.value)} />
            </div>
            <div>
              <Label htmlFor="edit-time">{t("Dashboard.Rides.Time")}</Label>
              <Input id="edit-time" type="time" className="h-11" value={time} onChange={(event) => setTime(event.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="edit-notes">{t("Dashboard.Rides.ride-notes")}</Label>
            <Input id="edit-notes" className="h-11" value={notes} onChange={(event) => setNotes(event.target.value)} />
          </div>
          {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button className="h-11" disabled={busy} onClick={() => void save()}>
            {busy ? t("Dashboard.Rides.activity-loading") : t("Dashboard.Rides.save-ride")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
