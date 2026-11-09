"use client";

import { type useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";
import { AccountOtpInput } from "./account-otp-input";

type T = ReturnType<typeof useTranslations>;

export function AccountLoginCodeStep({
  t,
  recipient,
  channel,
  code,
  setCode,
  error,
  notice,
  onVerify,
  onUseDifferentEmail,
}: {
  t: T;
  recipient: string;
  channel: "email" | "whatsapp";
  code: string;
  setCode: (value: string) => void;
  error: string | null;
  notice: string | null;
  onVerify: () => void;
  onUseDifferentEmail: () => void;
}) {
  const title = channel === "whatsapp" ? t("whatsapp-code-title") : t("code-title");
  const help =
    channel === "whatsapp"
      ? t("whatsapp-code-help", { phone: recipient })
      : t("code-help", { email: recipient });
  const switchLabel =
    channel === "whatsapp" ? t("sign-in-with-email") : t("use-different-email");

  return (
    <>
      <h1 className="mb-[6px] text-[25px] font-semibold leading-[1.15] tracking-[-0.025em]">
        {title}
      </h1>
      <p className="mb-6 text-[13.5px] leading-[1.55] text-[var(--ink2)]">
        {help}
      </p>

      {error ? (
        <p role="alert" className="mb-4 text-[13px] text-[color:var(--err)]">
          {error}
        </p>
      ) : null}

      {notice ? (
        <p role="status" className="sr-only">
          {notice}
        </p>
      ) : null}

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          onVerify();
        }}
      >
        <AccountOtpInput
          value={code}
          onChange={setCode}
          groupLabel={t("code-group-label")}
          digitLabel={(number) => t("code-digit-label", { number })}
          onComplete={onVerify}
        />
        <Button type="submit" className="h-11 w-full rounded-[var(--radius)]">
          {t("verify-and-sign-in")}
        </Button>
      </form>

      <div className="mt-[14px] flex flex-wrap items-center justify-between gap-3 text-xs leading-[1.4] text-[var(--ink2)]">
        <span>{t("code-expiry")}</span>
        <button
          type="button"
          onClick={onUseDifferentEmail}
          className="inline-flex min-h-11 items-center text-[var(--link)]"
        >
          {switchLabel}
        </button>
      </div>
    </>
  );
}
