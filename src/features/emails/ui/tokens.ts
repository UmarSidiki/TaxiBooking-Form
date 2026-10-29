export const emailTokens = {
  page: "#f3f4f6",
  card: "#ffffff",
  border: "#e5e7eb",
  text: "#111827",
  muted: "#6b7280",
  subtle: "#f9fafb",
  font: "Arial, Helvetica, sans-serif",
  maxWidth: 600,
} as const;

export function statusColors(tone: "success" | "warning" | "danger" | "info" | "neutral") {
  switch (tone) {
    case "success":
      return { bg: "#ecfdf5", fg: "#047857", border: "#a7f3d0" };
    case "warning":
      return { bg: "#fffbeb", fg: "#92400e", border: "#fde68a" };
    case "danger":
      return { bg: "#fef2f2", fg: "#b91c1c", border: "#fecaca" };
    case "info":
      return { bg: "#eff6ff", fg: "#1d4ed8", border: "#bfdbfe" };
    default:
      return { bg: "#f3f4f6", fg: "#374151", border: "#e5e7eb" };
  }
}
