"use client";

import type { ReactNode } from "react";
import { useSession } from "next-auth/react";
import type { useTranslations } from "next-intl";

import { DeskPageMeta } from "@/features/dashboard/ui/desk-page-chrome";

type TFn = ReturnType<typeof useTranslations>;

export function AdminHomeHeader({
  t,
  children,
}: {
  t: TFn;
  children?: ReactNode;
}) {
  const { data, status } = useSession();
  const name = data?.user?.name;
  const description =
    status === "loading"
      ? undefined
      : name
        ? `${t("Dashboard.Home.welcome-back")} ${name}`
        : t("Dashboard.Home.welcome-back");

  return (
    <>
      <DeskPageMeta
        title={t("Dashboard.Home.dashboard")}
        description={description}
      />
      {children}
    </>
  );
}
