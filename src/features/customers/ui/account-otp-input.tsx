"use client";

import { useRef } from "react";

import { Input } from "@/shared/ui/input";
import {
  OTP_LENGTH,
  mergeOtpEntry,
  otpDisplayValue,
  otpFocusAfterKey,
  setOtpDigit,
} from "@/features/customers/lib/otp-entry";

export function AccountOtpInput({
  value,
  onChange,
  groupLabel,
  digitLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  groupLabel: string;
  digitLabel: (number: number) => string;
}) {
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  const focus = (index: number) => {
    inputs.current[index]?.focus();
  };

  return (
    <div
      role="group"
      aria-label={groupLabel}
      className="mb-4 grid grid-cols-6 gap-1 sm:gap-2"
    >
      {Array.from({ length: OTP_LENGTH }, (_, index) => (
        <Input
          key={index}
          ref={(node) => {
            inputs.current[index] = node;
          }}
          id={index === 0 ? "account-code" : `account-code-${index + 1}`}
          name={index === 0 ? "code" : undefined}
          value={otpDisplayValue(value, index)}
          aria-label={digitLabel(index + 1)}
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          autoComplete={index === 0 ? "one-time-code" : "off"}
          className="h-[54px] min-w-0 rounded-[var(--radius)] border-[var(--rule2)] bg-[var(--sheet)] px-0 text-center text-base font-medium tabular-nums md:text-base max-[359px]:h-12"
          onFocus={(event) => event.currentTarget.select()}
          onChange={(event) => {
            const next = mergeOtpEntry(value, index, event.target.value);
            onChange(next.value);
            focus(next.focusIndex);
          }}
          onPaste={(event) => {
            event.preventDefault();
            const next = mergeOtpEntry(
              value,
              index,
              event.clipboardData.getData("text"),
            );
            onChange(next.value);
            focus(next.focusIndex);
          }}
          onKeyDown={(event) => {
            if (
              event.key === "Backspace" &&
              !otpDisplayValue(value, index) &&
              index > 0
            ) {
              event.preventDefault();
              onChange(setOtpDigit(value, index - 1, ""));
              focus(index - 1);
              return;
            }
            if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
              event.preventDefault();
              focus(otpFocusAfterKey(value, index, event.key));
            }
          }}
        />
      ))}
    </div>
  );
}
