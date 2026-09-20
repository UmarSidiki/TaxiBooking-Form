"use client";

import type { ReactNode } from "react";
import { useSession } from "next-auth/react";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations>;

export function AdminHomeHeader({
  t,
  children,
}: {
  t: TFn;
  children?: ReactNode;
}) {
  const { data } = useSession();
  const name = data?.user?.name;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t("Dashboard.Home.dashboard")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {name
            ? `${t("Dashboard.Home.welcome-back")} ${name}`
            : t("Dashboard.Home.welcome-back")}
        </p>
      </div>
      {children}
    </div>
  );
}
