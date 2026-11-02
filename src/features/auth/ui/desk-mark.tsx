"use client";

import { BrandLogo, useBrandIdentity } from "@/features/settings/ui/brand-logo";
import { cn } from "@/shared/lib/utils";

/** Operator logo plate on the desk sign-in, register and forgot-password pages; initial when no logo. */
export function DeskMark({ className }: { className?: string }) {
  const brand = useBrandIdentity(process.env.NEXT_PUBLIC_WEBSITE_NAME ?? "");
  return (
    <div
      className={cn(
        "relative grid h-9 min-w-9 max-w-40 shrink-0 place-items-center overflow-hidden rounded-md bg-card px-1 ring-1 ring-border",
        className
      )}
    >
      <BrandLogo
        brand={brand}
        imgProps={{ className: "h-7 w-auto max-w-full object-contain" }}
        initialClassName="text-sm font-semibold text-foreground"
      />
    </div>
  );
}
