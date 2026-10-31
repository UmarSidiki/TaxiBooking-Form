"use client";

import { type useTranslations } from "next-intl";

import { AccountBrandPlate, AccountLoginFooter } from "./account-login-brand";
import { AccountLoginCodeStep } from "./account-login-code-step";
import { AccountLoginEmailStep } from "./account-login-email-step";

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
  onSend: () => void;
  onVerify: () => void;
  onUseDifferentEmail: () => void;
}) {
  const name = brandName.trim() || t("brand-fallback");
  const year = new Date().getFullYear();

  return (
    <main className="riviera flex min-h-svh flex-col items-center justify-center bg-[var(--paper)] px-4 py-7 pb-10 text-[var(--ink)] sm:px-6 sm:py-12">
      <div className="w-full max-w-[420px]">
        <AccountBrandPlate
          name={name}
          tagline={t("brand-tagline")}
          logoUrl={logoUrl}
        />

        <div className="sm:rounded-[var(--radius)] sm:border sm:border-[var(--rule)] sm:bg-[var(--sheet)] sm:p-[30px]">
          {phase === "code" ? (
            <AccountLoginCodeStep
              t={t}
              email={email}
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
