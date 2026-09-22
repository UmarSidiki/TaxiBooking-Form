"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/shared/i18n/navigation";

import { DeskCredentialsForm } from "@/features/auth/ui/desk-credentials-form";

export function DeskSignInForm() {
  const t = useTranslations("Auth.SignIn");
  const desk = useTranslations("Auth.Desk");

  return (
    <DeskCredentialsForm
      callbackUrl="/dashboard"
      title={t("title")}
      subtitle={t("subtitle")}
      cover={{
        kicker: desk("cover_kicker"),
        title: desk("cover_title"),
        body: desk("cover_body"),
      }}
      footer={
        <Link
          href="/dashboard/forgot-password"
          className="mt-4 inline-flex min-h-11 items-center rounded-sm text-sm text-primary underline-offset-4 transition-colors duration-200 hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {t("forgot")}
        </Link>
      }
    />
  );
}
