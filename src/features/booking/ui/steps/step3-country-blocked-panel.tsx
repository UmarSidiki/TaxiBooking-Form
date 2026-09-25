"use client";

import { useTranslations } from "next-intl";
import { Globe2 } from "lucide-react";

import { Card } from "@/shared/ui/card";

/**
 * Shown in step 3 in place of the payment options when the visitor's country is
 * not on the operator's booking allow-list.
 */
export function Step3CountryBlockedPanel({
  t,
}: {
  t: ReturnType<typeof useTranslations>;
}) {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;

  return (
    <Card className="p-5 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <Globe2 className="size-5 text-primary mt-0.5" aria-hidden="true" />
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="font-semibold text-lg">
            {t("CountryBlocked.title")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t("CountryBlocked.body")}
          </p>
        </div>
      </div>
      {supportEmail ? (
        <a
          href={`mailto:${supportEmail}`}
          className="text-sm font-medium text-primary underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
        >
          {supportEmail}
        </a>
      ) : null}
    </Card>
  );
}
