"use client";

import type { ReactNode } from "react";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations>;

export function AdminHomeHeader({
  t,
  children,
}: {
  t: TFn;
  children?: ReactNode;
}) {
  return (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {t("Dashboard.Home.dashboard")}
            </h1>
            <p className="text-gray-500 mt-1">
              {t("Dashboard.Home.welcome-back")}
            </p>
          </div>
          {children}
        </div>
  );
}
