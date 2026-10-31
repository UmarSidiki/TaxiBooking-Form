"use client";

import { type useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

type T = ReturnType<typeof useTranslations>;

export function AccountLoginWhatsAppStep({
  t,
  phone,
  callingCode,
  onPhoneChange,
  onCallingCodeChange,
  onSend,
  notVerified,
  busy,
  error,
  onBackToEmail,
}: {
  t: T;
  phone: string;
  callingCode: string;
  onPhoneChange: (value: string) => void;
  onCallingCodeChange: (value: string) => void;
  onSend: () => void;
  notVerified: boolean;
  busy: boolean;
  error: string | null;
  onBackToEmail: () => void;
}) {
  return (
    <>
      <h1 className="mb-[6px] text-[25px] font-semibold leading-[1.15] tracking-[-0.025em]">
        {t("whatsapp-title")}
      </h1>
      <p className="mb-6 text-[13.5px] leading-[1.55] text-[var(--ink2)]">
        {t("whatsapp-help")}
      </p>

      {notVerified ? (
        <div
          role="alert"
          className="mb-4 rounded-[var(--radius)] border border-[var(--rule)] bg-[var(--well)] p-4"
        >
          <p className="mb-[14px] text-[13.5px] leading-[1.55] text-[var(--ink2)]">
            {t("whatsapp-not-verified")}
          </p>
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full rounded-[var(--radius)] border-[var(--rule2)] bg-transparent text-[var(--ink)] hover:bg-[var(--well)] hover:text-[var(--ink)]"
            onClick={onBackToEmail}
          >
            {t("sign-in-with-email")}
          </Button>
        </div>
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
        <div className="mb-4 flex gap-2">
          <div className="w-[88px] shrink-0">
            <label
              htmlFor="account-whatsapp-calling-code"
              className="mb-[6px] block text-[12px] font-medium text-[var(--ink2)]"
            >
              {t("whatsapp-calling-code")}
            </label>
            <Input
              id="account-whatsapp-calling-code"
              name="callingCode"
              type="tel"
              inputMode="tel"
              autoComplete="tel-country-code"
              dir="ltr"
              placeholder="+1"
              value={callingCode}
              onChange={(event) => onCallingCodeChange(event.target.value)}
              className="h-[46px] rounded-[var(--radius)] border-[var(--rule2)] bg-[var(--sheet)] px-3"
            />
          </div>
          <div className="min-w-0 flex-1">
            <label
              htmlFor="account-whatsapp-phone"
              className="mb-[6px] block text-[12px] font-medium text-[var(--ink2)]"
            >
              {t("whatsapp-phone")}
            </label>
            <Input
              id="account-whatsapp-phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              dir="ltr"
              placeholder={t("whatsapp-phone-placeholder")}
              value={phone}
              onChange={(event) => onPhoneChange(event.target.value)}
              className="h-[46px] rounded-[var(--radius)] border-[var(--rule2)] bg-[var(--sheet)] px-3"
            />
          </div>
        </div>
        <Button
          type="submit"
          className="h-11 w-full rounded-[var(--radius)]"
          disabled={busy || !phone.trim()}
        >
          {busy ? t("whatsapp-sending") : t("whatsapp-send-code")}
        </Button>
      </form>

      {notVerified ? null : (
        <div className="mt-[14px] flex justify-end">
          <button
            type="button"
            onClick={onBackToEmail}
            className="inline-flex min-h-11 items-center text-xs leading-[1.4] text-[var(--link)]"
          >
            {t("sign-in-with-email")}
          </button>
        </div>
      )}

      <p className="mt-5 text-[11.5px] leading-[1.6] text-[var(--ink2)]">
        {t("sign-in-note")}
      </p>
    </>
  );
}
