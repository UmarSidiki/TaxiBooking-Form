"use client";

/** Status tones; colours come from the --{tone} / --{tone}-tint tokens in riviera-palettes.css. */
export type StatusTone = "ok" | "warn" | "err" | "info" | "muted";

export function StatusMark({ tone = "muted", label }: { tone?: StatusTone; label: string }) {
  return (
    <span className="status-mark" data-tone={tone}>
      <span className="status-mark__dot" aria-hidden="true" />
      {label}
    </span>
  );
}
