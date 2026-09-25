"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import type { IBooking } from "@/features/booking/model";
import type { useTranslations } from "next-intl";

export function AdminRideRequestActionsDialog({
  t,
  booking,
  open,
  onOpenChange,
  currencySymbol,
  onQuote,
  onConfirmCash,
  onDecline,
}: {
  t: ReturnType<typeof useTranslations>;
  booking: IBooking;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currencySymbol: string;
  onQuote: (amount: number) => Promise<boolean>;
  onConfirmCash: () => Promise<boolean>;
  onDecline: (reason?: string) => Promise<boolean>;
}) {
  const estimate =
    booking.estimatedAmount ?? booking.totalAmount ?? 0;
  const [amount, setAmount] = useState(estimate);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<boolean>) => {
    setBusy(true);
    try {
      const ok = await fn();
      if (ok) onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("Dashboard.Rides.request-actions-title")}</DialogTitle>
          <DialogDescription>
            {t("Dashboard.Rides.request-actions-help", {
              tripId: booking.tripId,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="quotedAmount">
              {t("Dashboard.Rides.quoted-amount-label")} ({currencySymbol})
            </Label>
            <Input
              id="quotedAmount"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              className="h-11"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              {t("Dashboard.Rides.estimated-amount-hint", {
                amount: `${currencySymbol}${Number(estimate).toFixed(2)}`,
              })}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="declineReason">
              {t("Dashboard.Rides.decline-reason-label")}
            </Label>
            <Textarea
              id="declineReason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            className="min-h-11 w-full"
            disabled={busy || !(amount >= 0)}
            onClick={() => run(() => onQuote(amount))}
          >
            {t("Dashboard.Rides.confirm-send-pay-link")}
          </Button>
          <Button
            variant="secondary"
            className="min-h-11 w-full"
            disabled={busy}
            onClick={() => run(() => onConfirmCash())}
          >
            {t("Dashboard.Rides.confirm-as-cash")}
          </Button>
          <Button
            variant="destructive"
            className="min-h-11 w-full"
            disabled={busy}
            onClick={() => run(() => onDecline(reason || undefined))}
          >
            {t("Dashboard.Rides.not-available")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
