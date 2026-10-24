"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";

import { PaymentWebhookCopy } from "@/features/settings/ui/payment-webhook-copy";

function useOrigin() {
  return useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => "",
  );
}

export function ModuleAccessLinks({
  loginPath,
  signupPath,
}: {
  loginPath: string;
  signupPath: string;
}) {
  const t = useTranslations();
  const origin = useOrigin();

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border p-4">
      <AccessRow
        label={t("Dashboard.Features.login-link")}
        url={origin ? `${origin}${loginPath}` : ""}
        t={t}
      />
      <AccessRow
        label={t("Dashboard.Features.signup-link")}
        url={origin ? `${origin}${signupPath}` : ""}
        t={t}
      />
    </div>
  );
}

function AccessRow({
  label,
  url,
  t,
}: {
  label: string;
  url: string;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <span className="shrink-0 text-sm font-medium text-foreground sm:w-28">
        {label}
      </span>
      <p className="min-w-0 flex-1 break-all text-sm text-muted-foreground" dir="ltr">
        {url || "…"}
      </p>
      {url ? <PaymentWebhookCopy url={url} t={t} /> : null}
    </div>
  );
}
