"use client";

import { useEffect, useState } from "react";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import type { Ride } from "./account-types";
import { formatPortalMoney } from "./portal-money";

type Preview = {
  currentTotal?: number;
  newTotal?: number;
  paid?: number;
  difference?: number;
  action?: "pay" | "refund" | "none" | "balance_due";
  amount?: number;
  payUrl?: string;
  refundRequestId?: string;
  totalAmount?: number;
};

export function ChangeTripDialog({
  open,
  onOpenChange,
  ride,
  t,
  onSubmit,
  submitting,
  result,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  ride: Ride | null;
  t: (k: string, vars?: Record<string, string | number>) => string;
  onSubmit: (data: { date: string; time: string; passengers: number; childSeats: number; babySeats: number; meetAndGreet: boolean; pickup?: string; dropoff?: string; selectedVehicle?: string }) => void;
  submitting: boolean;
  result: Preview | null;
}) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [childSeats, setChildSeats] = useState(0);
  const [babySeats, setBabySeats] = useState(0);
  const [meetAndGreet, setMeetAndGreet] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [previewing, setPreviewing] = useState(false);

  useEffect(() => {
    if (ride && open) {
      setDate(ride.date);
      setTime(ride.time);
      setPickup(ride.pickup ?? "");
      setDropoff(ride.dropoff ?? "");
      setSelectedVehicle(ride.selectedVehicle ?? "");
      setPassengers(ride.passengers ?? 1);
      setChildSeats(ride.childSeats ?? 0);
      setBabySeats(ride.babySeats ?? 0);
      setMeetAndGreet(ride.meetAndGreet ?? false);
      setPreview(null);
      setPreviewError(null);
    }
  }, [ride, open]);

  useEffect(() => {
    if (!open) return;
    fetch("/api/vehicles?isActive=true")
      .then((r) => r.json())
      .then((d) => setVehicles(d?.data ?? []))
      .catch(() => setVehicles([]));
  }, [open]);

  const [previewError, setPreviewError] = useState<string | null>(null);

  const review = async () => {
    if (!ride) return;
    setPreviewing(true);
    setPreviewError(null);
    try {
      const res = await fetch(`/api/account/trips/${ride.tripId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change",
          dryRun: true,
          date,
          time,
          pickup,
          dropoff,
          selectedVehicle,
          passengers,
          childSeats,
          babySeats,
          meetAndGreet,
        }),
      });
      const body = await res.json().catch(() => null);
      if (res.ok && body?.ok) setPreview(body);
      else setPreviewError(t("change-preview-failed"));
    } catch {
      setPreviewError(t("change-preview-failed"));
    } finally {
      setPreviewing(false);
    }
  };

  const confirm = () => {
    onSubmit({ date, time, passengers, childSeats, babySeats, meetAndGreet, pickup, dropoff, selectedVehicle });
  };

  const fmt = formatPortalMoney;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("change-title")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="change-pickup">{t("pickup")}</Label>
            <Input id="change-pickup" className="h-11 text-base" value={pickup} onChange={(e) => setPickup(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="change-dropoff">{t("dropoff")}</Label>
            <Input id="change-dropoff" className="h-11 text-base" value={dropoff} onChange={(e) => setDropoff(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="change-date">{t("date")}</Label>
            <Input id="change-date" type="date" className="h-11 text-base" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="change-time">{t("time")}</Label>
            <Input id="change-time" type="time" className="h-11 text-base" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="change-vehicle">{t("vehicle")}</Label>
            <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
              <SelectTrigger id="change-vehicle" className="h-11 text-base">
                <SelectValue placeholder={t("vehicle")} />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((v) => (
                  <SelectItem key={v._id} value={v._id}>{v.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="change-pax">{t("passengers")}</Label>
            <Input id="change-pax" type="number" min={1} className="h-11 text-base" value={passengers} onChange={(e) => setPassengers(Number(e.target.value) || 1)} />
          </div>
          <div>
            <Label htmlFor="change-child">{t("child-seats")}</Label>
            <Input id="change-child" type="number" min={0} className="h-11 text-base" value={childSeats} onChange={(e) => setChildSeats(Number(e.target.value) || 0)} />
          </div>
          <div>
            <Label htmlFor="change-baby">{t("baby-seats")}</Label>
            <Input id="change-baby" type="number" min={0} className="h-11 text-base" value={babySeats} onChange={(e) => setBabySeats(Number(e.target.value) || 0)} />
          </div>
          <label className="flex min-h-11 cursor-pointer items-center gap-3 py-2 text-base sm:text-sm">
            <input type="checkbox" className="size-5" checked={meetAndGreet} onChange={(e) => setMeetAndGreet(e.target.checked)} />
            {t("meet-greet")}
          </label>
        </div>

        <div aria-live="polite" className="mt-3 rounded-md border border-border p-3 text-sm">
          {!preview ? (
            <>
              <p>{t("change-review")}</p>
              {previewError ? <p role="alert" className="text-destructive">{previewError}</p> : null}
            </>
          ) : (
            <>
              <p>{t("change-current-total")}: {fmt(preview.currentTotal)}</p>
              <p>{t("change-new-total")}: {fmt(preview.newTotal)}</p>
              <p>{t("change-already-paid")}: {fmt(preview.paid)}</p>
              <p className="font-semibold">
                {preview.action === "pay"
                  ? t("change-pay-now", { amount: fmt(preview.amount) })
                  : preview.action === "refund"
                    ? t("change-refund-pending", { amount: fmt(preview.amount) })
                    : preview.action === "balance_due"
                      ? t("change-balance-due", { amount: fmt(preview.amount) })
                      : t("change-no-change")}
              </p>
              {preview.action === "pay" ? <p className="text-muted-foreground">{t("change-booking-unchanged")}</p> : null}
            </>
          )}
        </div>

        {result?.payUrl ? (
          <div className="mt-2 text-sm">
            <a className="text-primary underline" href={result.payUrl} target="_blank" rel="noreferrer">{t("pay-now")}</a>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>{t("close")}</Button>
          <Button variant="outline" onClick={review} disabled={previewing || submitting}>{previewing ? `${t("loading")}…` : t("change-review")}</Button>
          <Button onClick={confirm} disabled={submitting || !preview}>{submitting ? `${t("saving")}…` : t("confirm-change")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}