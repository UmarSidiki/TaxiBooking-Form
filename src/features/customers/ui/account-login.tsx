"use client";

import Link from "next/link";
import { useLocale, type useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";

import { AccountBrandPlate, AccountLoginFooter } from "./account-login-brand";
import { AccountLoginCodeStep } from "./account-login-code-step";
import { AccountLoginEmailStep } from "./account-login-email-step";
import { AccountLoginWhatsAppStep } from "./account-login-whatsapp-step";
import type { WhatsAppLogin } from "../hooks/use-whatsapp-login";

type T = ReturnType<typeof useTranslations>;

export function AccountLogin({
  t,
  email,
  onEmailChange,
  code,
  setCode,
  phase,
  expired,
  noBooking,
  error,
  notice,
  brandName,
  logoUrl,
  whatsapp,
  onSend,
  onVerify,
  onUseDifferentEmail,
}: {
  t: T;
  email: string;
  onEmailChange: (value: string) => void;
  code: string;
  setCode: (value: string) => void;
  phase: "login" | "code";
  expired: boolean;
  noBooking: boolean;
  error: string | null;
  notice: string | null;
  brandName: string;
  logoUrl: string;
  whatsapp: WhatsAppLogin;
  onSend: () => void;
  onVerify: () => void;
  onUseDifferentEmail: () => void;
}) {
  const locale = useLocale();
  const name = brandName.trim();
  const year = new Date().getFullYear();

  return (
    <main className="riviera no-map flex min-h-svh flex-col items-center justify-center bg-[var(--paper)] px-4 py-7 pb-10 text-[var(--ink)] sm:px-6 sm:py-12">
      <div className="w-full max-w-[420px]">
        <Link
          href={`/${locale}`}
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--ink2)] no-underline transition-colors hover:text-[var(--ink)]"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          {t("book-a-ride")}
        </Link>

        <AccountBrandPlate
          name={name}
          tagline={t("brand-tagline")}
          logoUrl={logoUrl}
          className="mb-[26px]"
        />

        <div className="sm:rounded-[var(--radius)] sm:border sm:border-[var(--rule)] sm:bg-[var(--sheet)] sm:p-[30px]">
          {whatsapp.mode === "code" ? (
            <AccountLoginCodeStep
              t={t}
              recipient={whatsapp.phoneDisplay}
              channel="whatsapp"
              code={whatsapp.code}
              setCode={whatsapp.setCode}
              error={whatsapp.error}
              notice={whatsapp.notice}
              onVerify={whatsapp.verify}
              onUseDifferentEmail={whatsapp.backToEmail}
            />
          ) : whatsapp.mode === "phone" ? (
            <AccountLoginWhatsAppStep
              t={t}
              phone={whatsapp.phone}
              callingCode={whatsapp.callingCode}
              onPhoneChange={whatsapp.setPhone}
              onCallingCodeChange={whatsapp.setCallingCode}
              onSend={whatsapp.send}
              notVerified={whatsapp.notVerified}
              busy={whatsapp.busy}
              error={whatsapp.error}
              onBackToEmail={whatsapp.backToEmail}
            />
          ) : phase === "code" ? (
            <AccountLoginCodeStep
              t={t}
              recipient={email}
              channel="email"
              code={code}
              setCode={setCode}
              error={error}
              notice={notice}
              onVerify={onVerify}
              onUseDifferentEmail={onUseDifferentEmail}
            />
          ) : (
            <AccountLoginEmailStep
              t={t}
              email={email}
              onEmailChange={onEmailChange}
              onSend={onSend}
              onWhatsApp={whatsapp.open}
              noBooking={noBooking}
              expired={expired}
              error={error}
              onUseDifferentEmail={onUseDifferentEmail}
            />
          )}
        </div>

        <AccountLoginFooter
          text={t("copyright", { year, name })}
        />
      </div>
    </main>
  );
}
