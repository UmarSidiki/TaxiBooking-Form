"use client";

import { useEffect, useState } from "react";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/ui/dialog";
import type { Ride } from "./account-types";

type Quote = { feePercent: number; feeAmount: number; refundAmount: number; totalAmount: number; paid?: number };

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
  t: (k: string, vars?: Record<string, string | number>) => string;
  locale: string;
  onConfirm: () => void;
  submitting: boolean;
}) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!open || !ride) return;
    let cancelled = false;
    setLoading(true);
    setFailed(false);
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
            paid: data.paid ?? data.totalAmount,
          });
        } else {
          setFailed(true);
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, ride]);

  const fmt = (n?: number) => (typeof n === "number" ? n.toFixed(2) : "—");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("cancel-title")}</DialogTitle>
        </DialogHeader>
        {loading ? <p>{t("loading")}…</p> : null}
        {failed ? <p role="alert" className="text-destructive">{t("cancel-preview-failed")}</p> : null}
        {quote ? (
          <div className="space-y-2 text-sm" aria-live="polite">
            <p>{t("cancel-paid")}: {fmt(quote.paid)}</p>
            <p>{t("cancel-total")}: {fmt(quote.totalAmount)}</p>
            <p>{t("cancel-fee")}: {quote.feePercent}% ({fmt(quote.feeAmount)})</p>
            <p>
              {quote.refundAmount > 0
                ? `${t("cancel-refund")}: ${fmt(quote.refundAmount)}`
                : t("cancel-nothing-refund")}
            </p>
            <p className="text-muted-foreground">{t("cancel-pending-paylink")}</p>
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