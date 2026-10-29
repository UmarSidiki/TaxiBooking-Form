"use client";

import { useEffect, useState } from "react";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import type { Ride } from "./account-types";

type Result = { totalAmount?: number; payUrl?: string; refundRequestId?: string };

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
  t: (k: string) => string;
  onSubmit: (data: { date: string; time: string; passengers: number; childSeats: number; babySeats: number; meetAndGreet: boolean }) => void;
  submitting: boolean;
  result: Result | null;
}) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [childSeats, setChildSeats] = useState(0);
  const [babySeats, setBabySeats] = useState(0);
  const [meetAndGreet, setMeetAndGreet] = useState(false);

  useEffect(() => {
    if (ride && open) {
      setDate(ride.date);
      setTime(ride.time);
      setPassengers(ride.passengers ?? 1);
      setChildSeats(ride.childSeats ?? 0);
      setBabySeats(ride.babySeats ?? 0);
      setMeetAndGreet(ride.meetAndGreet ?? false);
    }
  }, [ride, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("change-title")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="change-date">{t("date")}</Label>
            <Input id="change-date" type="date" className="h-11 text-base" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="change-time">{t("time")}</Label>
            <Input id="change-time" type="time" className="h-11 text-base" value={time} onChange={(e) => setTime(e.target.value)} />
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
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={meetAndGreet} onChange={(e) => setMeetAndGreet(e.target.checked)} />
            {t("meet-greet")}
          </label>
        </div>
        {result ? (
          <div className="mt-3 rounded-md border border-border p-3 text-sm">
            {typeof result.totalAmount === "number" ? <p>{t("new-price")}: {result.totalAmount.toFixed(2)}</p> : null}
            {result.payUrl ? (
              <p>
                {t("pay-link-note")}{" "}
                <a className="text-primary underline" href={result.payUrl} target="_blank" rel="noreferrer">{t("pay-now")}</a>
              </p>
            ) : null}
            {result.refundRequestId ? <p>{t("refund-note")}</p> : null}
          </div>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>{t("close")}</Button>
          <Button onClick={() => onSubmit({ date, time, passengers, childSeats, babySeats, meetAndGreet })} disabled={submitting}>
            {submitting ? `${t("saving")}…` : t("save-changes")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}