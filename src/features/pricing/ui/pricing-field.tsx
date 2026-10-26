"use client";

import { useId } from "react";
import { Input } from "@/shared/ui/input";

/** Labelled input with a visible unit and helper text, wired for screen readers. */
export function PricingField({
  label,
  unit,
  help,
  error,
  value,
  onChange,
  type = "text",
  inputMode,
  placeholder,
}: {
  label: string;
  unit?: string;
  help?: string;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "time" | "date";
  inputMode?: "decimal" | "numeric" | "text";
  placeholder?: string;
}) {
  const id = useId();
  const describedBy = [help ? `${id}-help` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ");
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          type={type}
          inputMode={inputMode}
          placeholder={placeholder}
          value={value}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className={`h-11 text-base md:text-sm ${unit ? "pr-10" : ""}`}
          onChange={(event) => onChange(event.target.value)}
        />
        {unit ? (
          <span aria-hidden className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
            {unit}
          </span>
        ) : null}
      </div>
      {help ? (
        <p id={`${id}-help`} className="text-xs text-muted-foreground">
          {help}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Parses a user-typed number; returns null for blank or invalid input instead of 0. */
export function parseAmount(value: string): number | null {
  const trimmed = value.trim().replace(",", ".");
  if (trimmed === "") return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export type Notice = { tone: "ok" | "error"; text: string } | null;

export function PricingNotice({ notice }: { notice: Notice }) {
  return (
    <p role="status" aria-live="polite" className={`min-h-5 text-sm ${notice?.tone === "error" ? "text-destructive" : "text-muted-foreground"}`}>
      {notice?.text ?? ""}
    </p>
  );
}
