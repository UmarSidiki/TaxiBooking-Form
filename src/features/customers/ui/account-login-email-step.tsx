"use client";

import Link from "next/link";
import { useLocale, type useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

type T = ReturnType<typeof useTranslations>;

export function AccountLoginEmailStep({
  t,
  email,
  onEmailChange,
  onSend,
  onWhatsApp,
  noBooking,
  expired,
  error,
  onUseDifferentEmail,
}: {
  t: T;
  email: string;
  onEmailChange: (value: string) => void;
  onSend: () => void;
  onWhatsApp: () => void;
  noBooking: boolean;
  expired: boolean;
  error: string | null;
  onUseDifferentEmail: () => void;
}) {
  const locale = useLocale();

  return (
    <>
      <h1 className="mb-[6px] text-[25px] font-semibold leading-[1.15] tracking-[-0.025em]">
        {t("sign-in")}
      </h1>
      <p className="mb-6 text-[13.5px] leading-[1.55] text-[var(--ink2)]">
        {t("sign-in-help")}
      </p>

      {expired ? (
        <p
          role="alert"
          className="mb-4 rounded-[var(--radius)] border border-[var(--rule)] bg-[var(--warn-tint)] px-3 py-2 text-[13px] leading-[1.5] text-[color:var(--warn)]"
        >
          {t("link-expired")}
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="mb-4 text-[13px] text-[color:var(--err)]">
          {error}
        </p>
      ) : null}

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          onSend();
        }}
      >
        <div className="mb-4">
          <label
            htmlFor="account-email"
            className="mb-[6px] block text-[12px] font-medium text-[var(--ink2)]"
          >
            {t("email-address")}
          </label>
          <Input
            id="account-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            spellCheck={false}
            placeholder={t("email-placeholder")}
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            className="h-[46px] rounded-[var(--radius)] border-[var(--rule2)] bg-[var(--sheet)] px-3"
          />
        </div>
        {noBooking ? null : (
          <Button type="submit" className="h-11 w-full rounded-[var(--radius)]">
            {t("send-code")}
          </Button>
        )}
      </form>

      <div data-account-secondary-action="">
        <Button
          type="button"
          variant="outline"
          className="mt-2 h-11 w-full rounded-[var(--radius)] border-[var(--rule2)] bg-transparent text-[var(--ink)] hover:bg-[var(--well)] hover:text-[var(--ink)]"
          onClick={onWhatsApp}
        >
          {t("whatsapp-sign-in")}
        </Button>
      </div>

      <p className="mt-5 text-[11.5px] leading-[1.6] text-[var(--ink2)]">
        {t("sign-in-note")}
      </p>

      {noBooking ? (
        <div className="mt-[22px] rounded-[var(--radius)] border border-[var(--rule)] bg-[var(--well)] p-4">
          <p className="mb-[6px] text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--ink2)]">
            {t("no-rides-kicker")}
          </p>
          <p className="mb-[14px] text-[13.5px] leading-[1.55] text-[var(--ink2)]">
            {t("no-booking")}
          </p>
          <Button asChild className="h-11 w-full rounded-[var(--radius)]">
            <Link href={`/${locale}`}>{t("book-a-ride")}</Link>
          </Button>
        </div>
      ) : null}

      {noBooking ? (
        <button
          type="button"
          onClick={onUseDifferentEmail}
          className="mt-4 inline-flex min-h-11 items-center text-xs leading-[1.4] text-[var(--link)]"
        >
          {t("use-different-email")}
        </button>
      ) : null}
    </>
  );
}
