"use client";

import { useEffect, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { Minus, Plus } from "lucide-react";
import { MAX_PASSENGERS, MIN_PASSENGERS } from "@/features/booking/lib/passenger-limits";
import { cn } from "@/shared/lib/utils";

function clamp(value: number): number {
  if (!Number.isFinite(value)) return MIN_PASSENGERS;
  return Math.min(MAX_PASSENGERS, Math.max(MIN_PASSENGERS, Math.round(value)));
}

export function PassengerStepper({
  value,
  onChange,
  onBlur,
  decreaseLabel,
  increaseLabel,
  inputId,
  inputAriaLabel,
  className,
  inputClassName,
  inputStyle,
  buttonClassName,
  buttonStyle,
  icon,
  iconClassName,
  showHint = true,
  hintClassName,
}: {
  value: number;
  onChange: (value: number) => void;
  onBlur?: () => void;
  decreaseLabel: string;
  increaseLabel: string;
  inputId?: string;
  inputAriaLabel?: string;
  className?: string;
  inputClassName?: string;
  inputStyle?: CSSProperties;
  buttonClassName?: string;
  buttonStyle?: CSSProperties;
  icon?: ReactNode;
  iconClassName?: string;
  showHint?: boolean;
  hintClassName?: string;
}) {
  const safeValue = clamp(value);
  const [draft, setDraft] = useState(String(safeValue));

  useEffect(() => {
    setDraft(String(safeValue));
  }, [safeValue]);

  const commit = (next: number) => {
    const clamped = clamp(next);
    setDraft(String(clamped));
    onChange(clamped);
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-stretch gap-1">
        <button
          type="button"
          aria-label={decreaseLabel}
          disabled={safeValue <= MIN_PASSENGERS}
          onClick={() => commit(safeValue - 1)}
          className={cn(
            "inline-flex size-11 shrink-0 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40",
            buttonClassName
          )}
          style={buttonStyle}
        >
          <Minus className="size-4" aria-hidden="true" />
        </button>

        <div className="relative min-w-0 flex-1">
          {icon ? (
            <div
              className={cn(
                "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2",
                iconClassName
              )}
            >
              {icon}
            </div>
          ) : null}
          <input
            id={inputId}
            data-slot="input"
            aria-label={inputAriaLabel}
            type="number"
            inputMode="numeric"
            min={MIN_PASSENGERS}
            max={MAX_PASSENGERS}
            value={draft}
            onChange={(event) => {
              const raw = event.target.value;
              setDraft(raw);
              if (raw === "") return;
              const parsed = Number(raw);
              if (Number.isFinite(parsed)) onChange(clamp(parsed));
            }}
            onBlur={() => {
              commit(Number(draft));
              onBlur?.();
            }}
            className={cn(
              "h-11 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring/50",
              icon ? "pl-9" : "",
              inputClassName
            )}
            style={inputStyle}
          />
        </div>

        <button
          type="button"
          aria-label={increaseLabel}
          disabled={safeValue >= MAX_PASSENGERS}
          onClick={() => commit(safeValue + 1)}
          className={cn(
            "inline-flex size-11 shrink-0 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40",
            buttonClassName
          )}
          style={buttonStyle}
        >
          <Plus className="size-4" aria-hidden="true" />
        </button>
      </div>
      {showHint ? (
        <p className={cn("mt-1 text-xs text-muted-foreground", hintClassName)}>
          {MIN_PASSENGERS}–{MAX_PASSENGERS}
        </p>
      ) : null}
    </div>
  );
}
