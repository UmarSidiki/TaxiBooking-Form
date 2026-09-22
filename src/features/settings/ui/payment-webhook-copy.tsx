"use client";

import { useState } from "react";
import type { useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";

export function PaymentWebhookCopy({
  url,
  t,
}: {
  url: string;
  t: ReturnType<typeof useTranslations>;
}) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setState("copied");
    } catch {
      setState("failed");
    }
  };

  const label =
    state === "copied"
      ? t("WidgetConfigurator.copied")
      : state === "failed"
        ? t("Dashboard.Home.try-again")
        : t("Dashboard.Settings.copy");

  return (
    <Button
      type="button"
      variant="secondary"
      className="min-h-11 shrink-0"
      onClick={() => void copy()}
    >
      {label}
    </Button>
  );
}
