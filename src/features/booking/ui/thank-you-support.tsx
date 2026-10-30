"use client";

import { Phone } from "lucide-react";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations>;

export function ThankYouSupport({ t }: { t: TFn }) {
  const phone = process.env.NEXT_PUBLIC_PHONE_NUMBER?.trim();
  const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();
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
                    <a href={contact.href} className="font-medium text-primary underline-offset-4 hover:underline">
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
