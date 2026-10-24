"use client";

import { useTranslations } from "next-intl";

import { DeskCredentialsForm } from "@/features/auth/ui/desk-credentials-form";
import { Link } from "@/shared/i18n/navigation";

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
      footer={
        <Link
          href="/drivers/register"
          className="mt-6 inline-flex min-h-11 items-center text-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {t("register")}
        </Link>
      }
    />
  );
}
