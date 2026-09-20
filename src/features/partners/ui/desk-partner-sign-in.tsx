"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/shared/i18n/navigation";

import { DeskCredentialsForm } from "@/features/auth/ui/desk-credentials-form";

export function DeskPartnerSignIn() {
  const t = useTranslations("Auth.PartnerSignIn");

  return (
    <DeskCredentialsForm
      callbackUrl="/partners"
      title={t("title")}
      subtitle={t("subtitle")}
      cover={{
        kicker: t("cover_kicker"),
        title: t("cover_title"),
        body: t("cover_body"),
      }}
      footer={
        <Link
          href="/partners/register"
          className="mt-6 inline-flex min-h-11 items-center text-sm text-primary underline-offset-4 hover:underline"
        >
          {t("register")}
        </Link>
      }
    />
  );
}
