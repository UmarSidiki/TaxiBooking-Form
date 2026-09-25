"use client";

import { useTranslations } from "next-intl";
import { Globe2 } from "lucide-react";

import { Card } from "@/shared/ui/card";

export function BookingCountryBlocked({
  supportEmail,
}: {
  supportEmail?: string;
}) {
  const t = useTranslations("CountryBlocked");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-6 flex flex-col items-center gap-3 text-center">
        <Globe2 className="size-8 text-primary" aria-hidden="true" />
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("body")}</p>
        {supportEmail ? (
          <a
            href={`mailto:${supportEmail}`}
            className="text-sm font-medium text-primary underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          >
            {supportEmail}
          </a>
        ) : null}
      </Card>
    </div>
  );
}
