"use client";

import { useLocale, useTranslations } from "next-intl";

import type { WhatsAppDeskDelivery } from "@/features/settings/ui/whatsapp-desk-types";

export function WhatsAppDeliveryList({ deliveries }: { deliveries: WhatsAppDeskDelivery[] }) {
  const t = useTranslations("Dashboard.Settings");
  const locale = useLocale();
  const format = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  if (deliveries.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("whatsapp_deliveries_empty")}</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-border">
      {deliveries.map((item) => (
        <li key={item._id} className="flex min-w-0 flex-col gap-1 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span className="min-w-0 truncate" translate="no">
            {item.to}
          </span>
          <span className="text-muted-foreground">
            {item.audience === "customer"
              ? t("whatsapp_audience_customer")
              : t("whatsapp_audience_desk")}
            {" · "}
            {t(`whatsapp_status_${item.status}`)}
            {" · "}
            <span className="tabular-nums">{format.format(new Date(item.createdAt))}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
