"use client";

const TONES: Record<string, string> = {
  ok: "var(--ok)",
  warn: "var(--warn)",
  err: "var(--err)",
  info: "var(--info)",
  muted: "var(--ink2)",
};

export function StatusMark({ tone = "muted", label }: { tone?: keyof typeof TONES; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm" style={{ color: "var(--ink2)" }}>
      <span
        aria-hidden="true"
        style={{
          width: 8,
          height: 8,
          borderRadius: 2,
          background: TONES[tone] ?? TONES.muted,
          display: "inline-block",
        }}
      />
      <span style={{ color: "var(--ink)" }}>{label}</span>
    </span>
  );
}