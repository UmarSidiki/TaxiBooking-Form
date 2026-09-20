"use client";

import { useTranslations } from "next-intl";
import { AppErrorScreen } from "@/shared/chrome/app-error-screen";

export default function PartnerError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("AppError");
  return (
    <AppErrorScreen
      title={t("title")}
      description={t("description")}
      retryLabel={t("retry")}
      homeLabel={t("home")}
      onRetry={reset}
      homeHref="/partners/dashboard"
    />
  );
}
