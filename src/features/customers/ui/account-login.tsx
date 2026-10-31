"use client";

import Link from "next/link";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { useLocale, type useTranslations } from "next-intl";

type T = ReturnType<typeof useTranslations>;

export function AccountLogin({
  t,
  email,
  setEmail,
  code,
  setCode,
  phase,
  expired,
  noBooking,
  error,
  notice,
  onSend,
  onVerify,
}: {
  t: T;
  email: string;
  setEmail: (v: string) => void;
  code: string;
  setCode: (v: string) => void;
  phase: "login" | "code";
  expired: boolean;
  noBooking: boolean;
  error: string | null;
  notice: string | null;
  onSend: () => void;
  onVerify: () => void;
}) {
  const locale = useLocale();
  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 p-4">
      <h1 className="text-2xl font-semibold">{t("sign-in")}</h1>
      <p className="text-sm text-muted-foreground">{t("sign-in-help")}</p>
      {expired ? (
        <p role="alert" className="rounded-md border border-border bg-muted/40 p-4 text-sm text-foreground">
          {t("link-expired")}
        </p>
      ) : null}
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      {notice ? <p role="status" className="text-sm">{notice}</p> : null}
      <label className="text-sm" htmlFor="account-email">{t("email")}</label>
      <Input id="account-email" className="h-11 text-base" value={email} onChange={(e) => setEmail(e.target.value)} />
      {phase === "code" ? (
        <>
          <label className="text-sm" htmlFor="account-code">{t("code")}</label>
          <Input id="account-code" className="h-11 text-base" value={code} onChange={(e) => setCode(e.target.value)} />
          <Button className="h-11" type="button" onClick={onVerify}>{t("verify")}</Button>
        </>
      ) : noBooking ? (
        <div className="flex flex-col gap-3 rounded-md border border-border bg-muted/40 p-4">
          <p className="text-sm text-foreground">{t("no-booking")}</p>
          <Button asChild className="h-11">
            <Link href={`/${locale}`}>{t("book-a-ride")}</Link>
          </Button>
        </div>
      ) : (
        <Button className="h-11" type="button" onClick={onSend}>{t("send-code")}</Button>
      )}
    </div>
  );
}