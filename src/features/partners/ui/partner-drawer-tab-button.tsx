"use client";

import { cn } from "@/shared/lib/utils";

export type PartnerDrawerTabId =
  | "profile"
  | "billing"
  | "documents"
  | "fleet";

export function PartnerDrawerTabButton({
  id,
  icon: Icon,
  label,
  active,
  onSelect,
  mobile = false,
}: {
  id: PartnerDrawerTabId;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onSelect: (id: PartnerDrawerTabId) => void;
  mobile?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      aria-selected={active}
      aria-current={active ? "true" : undefined}
      className={cn(
        "flex items-center rounded-lg text-left text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        mobile
          ? "min-h-11 shrink-0 gap-1.5 px-3 py-2 text-xs"
          : "w-full gap-2.5 px-2.5 py-2",
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
      )}
    >
      <Icon
        className={cn(
          "shrink-0",
          mobile ? "size-3.5" : "size-4",
          active ? "text-primary" : "text-muted-foreground"
        )}
        aria-hidden="true"
      />
      <span className="truncate text-xs">{label}</span>
    </button>
  );
}
