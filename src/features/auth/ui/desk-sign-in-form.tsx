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
          className="mt-6 inline-flex min-h-11 items-center text-sm text-primary underline-offset-4 hover:underline"
        >
          {t("forgot")}
        </Link>
      }
    />
  );
}
