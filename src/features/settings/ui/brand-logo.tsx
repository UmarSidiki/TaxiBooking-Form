"use client";

import { useState, type ImgHTMLAttributes } from "react";

import { useTheme } from "@/features/settings/context/theme-context";
import { brandIdentity, type BrandIdentity } from "@/features/settings/lib/brand-identity";
import { useOptionalSettingsDesk } from "@/features/settings/ui/settings-desk-context";

/** Live brand: unsaved settings while editing them, otherwise the public settings every page carries. */
export function useBrandIdentity(fallbackName = ""): BrandIdentity {
  const draft = useOptionalSettingsDesk()?.settings;
  const { settings } = useTheme();
  // The desk draft starts empty while it loads, so it only overrides what it actually holds.
  return brandIdentity({ ...settings, ...draft }, fallbackName);
}

/** The operator logo, or the first letter of the name when there is none or it fails to load. */
export function BrandLogo({
  brand,
  imgProps,
  initialClassName,
}: {
  brand: BrandIdentity;
  imgProps?: Omit<ImgHTMLAttributes<HTMLImageElement>, "src">;
  initialClassName?: string;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  if (brand.logoUrl && failed !== brand.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt=""
        {...imgProps}
        src={brand.logoUrl}
        data-testid="brand-logo"
        onError={(event) => {
          setFailed(brand.logoUrl);
          imgProps?.onError?.(event);
        }}
      />
    );
  }
  return <span className={initialClassName} data-testid="brand-initial">{brand.initial}</span>;
}
