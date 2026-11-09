"use client";

import { Phone } from "lucide-react";
import type { useTranslations } from "next-intl";

import { useTheme } from "@/features/settings/context/theme-context";

type TFn = ReturnType<typeof useTranslations>;

export function ThankYouSupport({ t }: { t: TFn }) {
  const { settings } = useTheme();
  const phone = settings?.companyPhone?.trim();
  const email = settings?.adminEmail?.trim();
  const contacts = [
    phone ? { href: `tel:${phone.replace(/[^\d+]/g, "")}`, label: phone } : null,
    email ? { href: `mailto:${email}`, label: email } : null,
  ].filter((item): item is { href: string; label: string } => Boolean(item));

  return (
    <div className="mb-6 rounded border border-border bg-muted/40 p-4 sm:mb-8 sm:p-6">
      <div className="flex items-start gap-3">
        <Phone className="mt-0.5 size-5 shrink-0 text-foreground" />
        <div>
          <h3 className="mb-1 text-sm font-semibold text-foreground sm:text-base">{t("ThankYou.need-help")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("ThankYou.contact-operator")}
            {contacts.length > 0 ? (
              <>
                {" "}
                {contacts.map((contact, index) => (
                  <span key={contact.href}>
                    {index > 0 ? ` ${t("ThankYou.or")} ` : null}
                    {/* Inline-block contact links so the tap target is at
                        least 44px tall on mobile — plain text was 94x14px. */}
                    <a
                      href={contact.href}
                      className="inline-block min-h-11 py-1 align-baseline font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {contact.label}
                    </a>
                  </span>
                ))}
              </>
            ) : null}
          </p>
        </div>
      </div>
    </div>
  );
}
