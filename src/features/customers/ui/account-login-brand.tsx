"use client";

import { useState } from "react";

export function AccountBrandPlate({
  name,
  tagline,
  logoUrl,
  className = "",
}: {
  name: string;
  tagline: string;
  logoUrl: string;
  className?: string;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showLogo = Boolean(logoUrl) && failedUrl !== logoUrl;

  return (
    <div
      className={`inline-flex h-[38px] min-w-0 items-center gap-[9px] overflow-hidden rounded-[var(--radius)] border border-[var(--rule)] bg-[var(--sheet)] px-[10px] text-start ${className}`}
    >
      {showLogo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={name}
          className="h-[22px] w-auto min-w-0 max-w-full shrink object-contain"
          onError={() => setFailedUrl(logoUrl)}
        />
      ) : (
        <>
          <span
            aria-hidden="true"
            className="grid size-[22px] shrink-0 place-items-center rounded-[var(--radius-sm)] bg-[var(--sig)] text-[11px] font-semibold leading-none text-[var(--sig-on)]"
          >
            {name.charAt(0).toUpperCase()}
          </span>
          <span className="flex min-w-0 flex-col leading-none">
            <b
              dir="auto"
              className="min-w-0 max-w-full truncate text-[11.5px] font-semibold uppercase tracking-[0.18em] md:max-w-[210px]"
            >
              {name}
            </b>
            <small
              dir="auto"
              className="mt-[3px] min-w-0 max-w-full truncate text-[9px] font-medium uppercase tracking-[0.2em] text-[var(--ink2)]"
            >
              {tagline}
            </small>
          </span>
        </>
      )}
    </div>
  );
}

export function AccountLoginFooter({ text }: { text: string }) {
  return (
    <footer className="mt-7 text-[11px] leading-relaxed text-[var(--ink2)]">
      {text}
    </footer>
  );
}
