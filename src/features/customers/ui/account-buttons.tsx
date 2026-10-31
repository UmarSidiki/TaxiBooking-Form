import type { ComponentProps } from "react";
import { cn } from "@/shared/lib/utils";

type Variant = "primary" | "outline" | "ghost" | "link";
type Size = "md" | "sm" | "compact";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius)] border border-transparent font-medium leading-none whitespace-nowrap transition-[background-color,border-color,color,opacity] duration-150 motion-reduce:transition-none disabled:pointer-events-none disabled:opacity-50";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-[var(--ink)] text-[var(--paper)] hover:opacity-90",
  outline:
    "border-[var(--rule2)] bg-[var(--sheet)] text-[var(--ink)] hover:bg-[var(--well)]",
  ghost: "text-[var(--ink)] hover:bg-[var(--well)]",
  link: "text-[var(--link)] hover:underline hover:underline-offset-2",
};

const SIZES: Record<Size, string> = {
  md: "h-11 px-4 text-[13.5px]",
  sm: "h-11 px-3.5 text-[12.5px] lg:h-9",
  compact: "h-11 px-2.5 text-[11.5px] lg:h-8",
};

export function accountButtonClass({
  variant = "outline",
  size = "md",
  className,
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
} = {}) {
  return cn(BASE, VARIANTS[variant], SIZES[size], className);
}

export function AccountButton({
  variant,
  size,
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return (
    <button
      className={accountButtonClass({ variant, size, className })}
      {...props}
    />
  );
}

export function AccountLink({
  variant,
  size,
  className,
  ...props
}: ComponentProps<"a"> & { variant?: Variant; size?: Size }) {
  return (
    <a
      className={accountButtonClass({ variant, size, className })}
      {...props}
    />
  );
}
