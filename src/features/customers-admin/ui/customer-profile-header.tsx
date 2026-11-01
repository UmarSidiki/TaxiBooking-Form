"use client";

import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { Badge } from "@/shared/ui/badge";
import { CUSTOMER_LOCALES } from "@/features/customers-admin/schema/customer-list.schema";
import { CustomerConsentChips } from "@/features/customers-admin/ui/customer-consent-chips";
import { formatCustomerMoney } from "@/features/customers-admin/ui/customer-format";
import {
  formatProfileDate,
  formatProfilePhone,
  profileDisplayName,
  profileInitials,
} from "@/features/customers-admin/ui/customer-profile-format";
import type { CustomerProfileHeader as HeaderData } from "@/features/customers-admin/lib/customer-profile/customer-profile.types";

export function CustomerProfileHeader({ header }: { header: HeaderData }) {
  const t = useTranslations("Dashboard.CustomerProfile");
  const tCustomers = useTranslations("Dashboard.Customers");
  const locale = useLocale();
  const name = profileDisplayName(header.name, header.email);
  const phone = formatProfilePhone(header.verifiedPhone || header.phoneDigits);
  const language = (CUSTOMER_LOCALES as readonly string[]).includes(header.locale)
    ? tCustomers(`locale-${header.locale}`)
    : header.locale.toUpperCase();

  return (
    <div className="flex flex-col gap-4">
      <Link
        href={`/${locale}/dashboard/customers`}
        className="inline-flex min-h-11 w-fit items-center gap-1.5 rounded text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
        {t("back")}
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div
            aria-hidden="true"
            className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-base font-semibold"
          >
            {profileInitials(header.name, header.email)}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold">{name}</h1>
            <p className="truncate text-sm text-muted-foreground">{header.email}</p>
            <div className="mt-2">
              <CustomerConsentChips
                emailConsent={header.emailConsent}
                whatsappConsent={header.whatsappConsent}
              />
            </div>
          </div>
        </div>

        {phone ? (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="tabular-nums" translate="no">
              {phone}
            </span>
            {header.verifiedPhone ? (
              <Badge variant="secondary" className="rounded-chip">
                <Check className="size-3" aria-hidden="true" />
                {t("verified")}
              </Badge>
            ) : (
              <Badge variant="outline" className="rounded-chip text-muted-foreground">
                {t("not-verified")}
              </Badge>
            )}
          </div>
        ) : null}
      </div>

      <dl className="grid grid-cols-2 gap-4 rounded border border-border/60 bg-card p-4 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label={t("rides")} value={String(header.rides)} />
        <Stat label={t("completed-rides")} value={String(header.completedRides)} />
        <Stat
          label={t("lifetime-spend")}
          value={formatCustomerMoney(header.spendMinor, header.currency, locale)}
        />
        <Stat
          label={t("first-ride")}
          value={formatProfileDate(header.firstRideAt, locale) ?? t("never")}
        />
        <Stat
          label={t("last-ride")}
          value={formatProfileDate(header.lastRideAt, locale) ?? t("never")}
        />
        <Stat label={t("language")} value={language} />
      </dl>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate font-medium tabular-nums">{value}</dd>
    </div>
  );
}
