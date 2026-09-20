"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

export function DeskAuthCover({
  kicker,
  title,
  body,
}: {
  kicker?: string;
  title?: string;
  body?: string;
}) {
  const t = useTranslations("Auth.Desk");

  return (
    <div className="desk-auth-cover relative hidden min-h-svh overflow-hidden lg:block">
      <div className="absolute inset-y-0 start-0 w-px bg-sidebar-primary/40" />
      <div className="relative z-10 flex h-full flex-col justify-end p-10 xl:p-12">
        <p className="text-sm text-sidebar-foreground/70">
          {kicker ?? t("cover_kicker")}
        </p>
        <h2 className="mt-3 max-w-sm text-3xl font-semibold tracking-tight text-sidebar-foreground">
          {title ?? t("cover_title")}
        </h2>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-sidebar-foreground/75">
          {body ?? t("cover_body")}
        </p>
      </div>
      <div className="pointer-events-none absolute end-8 top-8 size-10 overflow-hidden rounded-md border border-sidebar-border">
        <Image src="/icon.png" alt="" fill className="object-cover" />
      </div>
    </div>
  );
}
