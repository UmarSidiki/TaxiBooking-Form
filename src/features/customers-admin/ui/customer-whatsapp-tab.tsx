"use client";

import type { ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Badge } from "@/shared/ui/badge";
import {
  formatProfileDateTime,
  formatProfilePhone,
  profileConsentKey,
} from "@/features/customers-admin/ui/customer-profile-format";
import type { CustomerWhatsAppInfo } from "@/features/customers-admin/lib/customer-profile/customer-profile.types";

const SEND_STATUS_KEYS = new Set([
  "queued",
  "sent",
  "failed",
  "fallback",
  "capped",
]);

export function CustomerWhatsAppTab({ whatsapp }: { whatsapp: CustomerWhatsAppInfo }) {
  const t = useTranslations("Dashboard.CustomerProfile");
  const tCustomers = useTranslations("Dashboard.Customers");
  const locale = useLocale();
  const phone = formatProfilePhone(whatsapp.verifiedPhone);
  const verifiedAt = formatProfileDateTime(whatsapp.verifiedAt, locale);
  const lastAt = formatProfileDateTime(whatsapp.lastSend?.at ?? null, locale);
  const sendStatus = whatsapp.lastSend?.status;
  const sendStatusKey =
    sendStatus && SEND_STATUS_KEYS.has(sendStatus)
      ? `send-status-${sendStatus}`
      : null;

  return (
    <div className="flex flex-col gap-3">
      {phone ? null : (
        <p className="rounded border border-border/60 bg-muted/40 p-4 text-sm text-muted-foreground">
          {t("whatsapp-not-verified")}
        </p>
      )}

      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Item label={t("whatsapp-verified-number")}>
          {phone ? (
            <span className="inline-flex flex-wrap items-center gap-2">
              <span className="tabular-nums" translate="no">
                {phone}
              </span>
              <Badge variant="secondary" className="rounded-chip">
                {t("verified")}
              </Badge>
            </span>
          ) : (
            <span className="text-muted-foreground">{t("not-verified")}</span>
          )}
        </Item>

        <Item label={t("whatsapp-verified-at")}>
          {verifiedAt ?? <span className="text-muted-foreground">{t("never")}</span>}
        </Item>

        <Item label={t("whatsapp-consent")}>
          {tCustomers(`consent-whatsapp-${profileConsentKey(whatsapp.consent)}`)}
        </Item>

        <Item label={t("whatsapp-last-send")}>
          {whatsapp.lastSend ? (
            <span className="inline-flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="rounded-chip">
                {sendStatusKey ? t(sendStatusKey) : "—"}
              </Badge>
              {lastAt ? (
                <span className="text-sm font-normal text-muted-foreground">{lastAt}</span>
              ) : null}
            </span>
          ) : (
            <span className="text-sm font-normal text-muted-foreground">
              {t("whatsapp-last-send-none")}
            </span>
          )}
        </Item>
      </dl>
    </div>
  );
}

function Item({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 rounded border border-border/60 bg-card p-4">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium">{children}</dd>
    </div>
  );
}
