"use client";

import { useTranslations } from "next-intl";

import { DeskCredentialsForm } from "@/features/auth/ui/desk-credentials-form";

export function DeskDriverSignIn() {
  const t = useTranslations("Auth.DriverSignIn");

  return (
    <DeskCredentialsForm
      callbackUrl="/drivers"
      title={t("title")}
      subtitle={t("subtitle")}
      cover={{
        kicker: t("cover_kicker"),
        title: t("cover_title"),
        body: t("cover_body"),
      }}
    />
  );
}
