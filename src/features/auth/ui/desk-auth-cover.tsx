"use client";

import { useTranslations } from "next-intl";

import { DeskMark } from "@/features/auth/ui/desk-mark";

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
        <p className="text-sm text-sidebar-foreground">
          {kicker ?? t("cover_kicker")}
        </p>
        <h2 className="mt-3 max-w-sm text-balance text-3xl font-semibold tracking-tight text-sidebar-foreground">
          {title ?? t("cover_title")}
        </h2>
        <p className="mt-3 max-w-sm text-pretty text-sm leading-relaxed text-sidebar-foreground">
          {body ?? t("cover_body")}
        </p>
      </div>
      <DeskMark className="pointer-events-none absolute end-8 top-8" />
    </div>
  );
}
