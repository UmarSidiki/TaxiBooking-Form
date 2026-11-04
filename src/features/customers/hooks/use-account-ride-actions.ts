"use client";

import { useState } from "react";
import type { AccountT, Ride } from "../ui/account-types";

export type ChangeResult = {
  totalAmount?: number;
  payUrl?: string;
  refundRequestId?: string;
  currentTotal?: number;
  newTotal?: number;
  paid?: number;
  difference?: number;
  action?: "pay" | "refund" | "none" | "balance_due";
  amount?: number;
};

type ChangePayload = {
  date: string;
  time: string;
  passengers: number;
  childSeats: number;
  babySeats: number;
  meetAndGreet: boolean;
  pickup?: string;
  dropoff?: string;
  selectedVehicle?: string;
};

export function useAccountRideActions({
  t,
  onRefresh,
}: {
  t: AccountT;
  onRefresh: () => Promise<boolean>;
}) {
  const [selected, setSelected] = useState<Ride | null>(null);
  const [changeOpen, setChangeOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [changeResult, setChangeResult] = useState<ChangeResult | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const openChange = (ride: Ride) => {
    setSelected(ride);
    setChangeResult(null);
    setNotice(null);
    setChangeOpen(true);
  };

  const openCancel = (ride: Ride) => {
    setSelected(ride);
    setNotice(null);
    setCancelOpen(true);
  };

  const handleChange = async (data: ChangePayload) => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const response = await fetch(`/api/account/trips/${selected.tripId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "change", ...data }),
      });
      const body = await response.json().catch(() => null);
      if (response.ok && body?.ok) {
        setChangeResult(body as ChangeResult);
        setNotice(t("updated"));
        if (body.payUrl) {
          window.location.href = body.payUrl;
          return;
        }
        setChangeOpen(false);
        setSelected(null);
        await onRefresh();
      } else {
        setNotice(t("cutoff"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const response = await fetch(`/api/account/trips/${selected.tripId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      if (response.ok) {
        setNotice(t("updated"));
        setCancelOpen(false);
        setSelected(null);
        await onRefresh();
      } else {
        setNotice(t("cutoff"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return {
    selected,
    changeOpen,
    setChangeOpen,
    cancelOpen,
    setCancelOpen,
    submitting,
    changeResult,
    notice,
    openChange,
    openCancel,
    handleChange,
    handleCancel,
  };
}
