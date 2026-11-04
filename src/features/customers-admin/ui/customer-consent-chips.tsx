"use client";

import { Mail, MessageCircle } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import { Badge } from "@/shared/ui/badge";
import type { CustomerConsentValue } from "@/features/customers-admin/lib/customer-list/customer-list.types";

const EMAIL_KEYS: Record<CustomerConsentValue, string> = {
  granted: "consent-email-granted",
  none: "consent-email-none",
  withdrawn: "consent-email-withdrawn",
};

const WHATSAPP_KEYS: Record<CustomerConsentValue, string> = {
  granted: "consent-whatsapp-granted",
  none: "consent-whatsapp-none",
  withdrawn: "consent-whatsapp-withdrawn",
};

export function CustomerConsentChips({
  emailConsent,
  whatsappConsent,
}: {
  emailConsent: CustomerConsentValue;
  whatsappConsent: CustomerConsentValue;
}) {
  const t = useTranslations("Dashboard.Customers");
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <ConsentChip
        granted={emailConsent === "granted"}
        icon={<Mail className="size-3" aria-hidden="true" />}
        label={t(EMAIL_KEYS[emailConsent])}
      />
      <ConsentChip
        granted={whatsappConsent === "granted"}
        icon={<MessageCircle className="size-3" aria-hidden="true" />}
        label={t(WHATSAPP_KEYS[whatsappConsent])}
      />
    </div>
  );
}

function ConsentChip({
  granted,
  icon,
  label,
}: {
  granted: boolean;
  icon: ReactNode;
  label: string;
}) {
  return (
    <Badge
      variant={granted ? "secondary" : "outline"}
      className={
        granted
          ? "rounded-chip border-transparent"
          : "rounded-chip text-muted-foreground"
      }
      title={label}
      aria-label={label}
    >
      {icon}
      <span>{label}</span>
    </Badge>
  );
}
