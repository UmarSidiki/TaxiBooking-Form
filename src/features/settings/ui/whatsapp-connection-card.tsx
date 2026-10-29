"use client";

import { useTranslations } from "next-intl";

import { WhatsAppLinkPanel } from "@/features/settings/ui/whatsapp-link-panel";
import { WhatsAppTestSend } from "@/features/settings/ui/whatsapp-test-send";
import type { WhatsAppDeskConfig } from "@/features/settings/ui/whatsapp-desk-types";

export function WhatsAppConnectionCard({ config }: { config: WhatsAppDeskConfig }) {
  const t = useTranslations("Dashboard.Settings");

  return (
    <div className="flex flex-col gap-5">
      <WhatsAppLinkPanel />
      <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
        <div>
          <p className="text-sm font-medium">{t("notify_number")}</p>
          <p className="text-sm text-muted-foreground" translate="no">
            {config.companyPhone || t("notify_number_empty")}
          </p>
        </div>
        <WhatsAppTestSend
          target={{
            event: "booking_confirmed",
            audience: "customer",
            locale: config.defaultLocale,
          }}
          fieldId="notify-connection-test"
        />
      </div>
    </div>
  );
}
