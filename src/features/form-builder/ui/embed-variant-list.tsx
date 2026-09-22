"use client";

import type { ReactNode } from "react";
import { Badge } from "@/shared/ui/badge";
import { Check } from "lucide-react";

export type EmbedVariant = {
  id: string;
  name: string;
  description: string;
  features: string[];
  path: string;
  icon: ReactNode;
  isCustom?: boolean;
  layoutId?: string;
};

export function EmbedVariantList({
  title,
  variants,
  selectedId,
  onSelect,
  badgeFor,
}: {
  title: string;
  variants: EmbedVariant[];
  selectedId: string;
  onSelect: (id: string) => void;
  badgeFor?: (variant: EmbedVariant) => string | null;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-xs font-medium text-muted-foreground">{title}</h3>
      <div className="grid gap-2">
        {variants.map((variant) => {
          const active = selectedId === variant.id;
          const badge = badgeFor?.(variant);
          return (
            <button
              key={variant.id}
              type="button"
              onClick={() => onSelect(variant.id)}
              aria-pressed={active}
              className={`flex min-h-11 items-start gap-3 rounded-md border px-3 py-3 text-start transition-colors duration-200 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${
                active
                  ? "border-primary bg-accent"
                  : "border-border bg-card hover:bg-muted"
              }`}
            >
              <span className="mt-0.5 text-primary" aria-hidden="true">{variant.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                  {variant.name}
                  {badge ? <Badge variant="secondary">{badge}</Badge> : null}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {variant.description}
                </span>
              </span>
              {active ? <Check className="size-4 text-primary" aria-hidden="true" /> : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
