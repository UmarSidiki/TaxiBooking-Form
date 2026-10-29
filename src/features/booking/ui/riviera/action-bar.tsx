"use client";

import { useBookingForm } from "@/features/booking/context/booking-form-context";

export function ActionBar({ total, primaryLabel, onPrimary, onBack }: {
  total?: number;
  primaryLabel: string;
  onPrimary?: () => void;
  onBack?: () => void;
}) {
  const { currentStep } = useBookingForm();
  return (
    <div className="bar">
      {currentStep > 1 && onBack && (
        <button type="button" className="back" aria-label="Back" onClick={onBack}>
          &larr;
        </button>
      )}
      <div className="sum">
        <small>Total</small>
        <span className="num">{total != null ? total.toFixed(2) : ""}</span>
      </div>
      <button type="button" className="go" onClick={onPrimary}>
        {primaryLabel}
      </button>
    </div>
  );
}