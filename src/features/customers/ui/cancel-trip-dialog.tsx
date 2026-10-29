"use client";

import { useEffect, useState } from "react";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/ui/dialog";
import type { Ride } from "./account-types";

type Quote = { feePercent: number; feeAmount: number; refundAmount: number; totalAmount: number };

export function CancelTripDialog({
  open,
  onOpenChange,
  ride,
  t,
  locale,
  onConfirm,
  submitting,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  ride: Ride | null;
  t: (k: string) => string;
  locale: string;
  onConfirm: () => void;
  submitting: boolean;
}) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !ride) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/account/trips/${ride.tripId}/quote-cancel`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.ok) {
          setQuote({
            feePercent: data.feePercent,
            feeAmount: data.feeAmount,
            refundAmount: data.refundAmount,
            totalAmount: data.totalAmount,
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, ride]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("cancel-title")}</DialogTitle>
        </DialogHeader>
        {loading ? <p>{t("loading")}…</p> : null}
        {quote ? (
          <div className="space-y-2 text-sm">
            <p>{t("cancel-total")}: {quote.totalAmount.toFixed(2)}</p>
            <p>{t("cancel-fee")}: {quote.feePercent}% ({quote.feeAmount.toFixed(2)})</p>
            <p>{t("cancel-refund")}: {quote.refundAmount.toFixed(2)}</p>
          </div>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>{t("close")}</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={submitting || loading || !quote}>
            {submitting ? `${t("cancelling")}…` : t("confirm-cancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}