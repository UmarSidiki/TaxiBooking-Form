"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRound, LogOut, Mail, MessageCircle, MonitorSmartphone } from "lucide-react";
import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import type { AccountT, CustomerProfile } from "./account-types";
import { AccountButton } from "./account-buttons";
import { AccountCard, AccountPageHeader } from "./account-page-header";
import { accountHref } from "../lib/account-sections";

export function AccountSecurity({
  t,
  email,
  locale,
  profile,
  onLogout,
  onSignOutEverywhere,
}: {
  t: AccountT;
  email: string;
  locale: string;
  profile: CustomerProfile | null;
  onLogout: () => void;
  onSignOutEverywhere: () => void;
}) {
  const [confirm, setConfirm] = useState(false);
  const phone = profile?.verifiedPhone ?? "";

  return (
    <>
      <AccountPageHeader title={t("security")} subtitle={t("security-subtitle")} />
      <div className="grid gap-4">
        <AccountCard id="sign-in" title={t("sign-in-methods")} description={t("sign-in-methods-copy")}>
          <ul className="m-0 grid list-none p-0">
            <Row
              icon={<Mail className="size-[18px]" strokeWidth={1.7} />}
              title={t("email-code")}
              detail={email}
              badge={t("primary")}
            />
            <Row
              icon={<MessageCircle className="size-[18px]" strokeWidth={1.7} />}
              title={t("whatsapp-code")}
              detail={phone || t("whatsapp-code-off")}
              badge={phone ? t("verified") : undefined}
              action={
                phone ? null : (
                  <Link
                    href={accountHref(locale, "profile", "phone")}
                    className="text-xs font-medium text-[var(--link)] hover:underline"
                  >
                    {t("add-whatsapp-number")}
                  </Link>
                )
              }
            />
            <Row
              icon={<KeyRound className="size-[18px]" strokeWidth={1.7} />}
              title={t("no-password")}
              detail={t("no-password-copy")}
            />
          </ul>
        </AccountCard>

        <AccountCard id="security" title={t("security-sessions")} description={t("security-copy")}>
          <ul className="m-0 grid list-none p-0">
            <Row
              icon={<MonitorSmartphone className="size-[18px]" strokeWidth={1.7} />}
              title={t("this-device")}
              detail={t("this-device-copy")}
              badge={t("active-now")}
              action={
                <AccountButton type="button" variant="outline" size="sm" onClick={onLogout}>
                  <LogOut className="size-3.5 rtl:rotate-180" aria-hidden="true" />
                  {t("logout")}
                </AccountButton>
              }
            />
          </ul>
          <div className="mt-4 rounded-[var(--radius)] border border-[var(--rule)] bg-[var(--well)] p-3.5">
            <b className="block text-[13px] font-medium">{t("sign-out-everywhere")}</b>
            <p className="mb-3 mt-1 text-xs leading-[1.55] text-[var(--ink2)]">
              {t("sign-out-everywhere-copy")}
            </p>
            <AccountButton type="button" variant="outline" onClick={() => setConfirm(true)}>
              {t("sign-out-everywhere")}
            </AccountButton>
          </div>
        </AccountCard>
      </div>

      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto pb-[max(1rem,env(safe-area-inset-bottom))]">
          <DialogHeader>
            <DialogTitle>{t("sign-out-everywhere-title")}</DialogTitle>
            <DialogDescription>{t("sign-out-everywhere-copy")}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <AccountButton type="button" variant="outline" onClick={() => setConfirm(false)}>
              {t("close")}
            </AccountButton>
            <AccountButton
              type="button"
              variant="primary"
              onClick={() => {
                setConfirm(false);
                onSignOutEverywhere();
              }}
            >
              {t("sign-out-everywhere")}
            </AccountButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Row({
  icon,
  title,
  detail,
  badge,
  action,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
  badge?: string;
  action?: ReactNode;
}) {
  return (
    <li className="flex flex-wrap items-center gap-3 border-t border-[var(--rule)] py-3.5 first:border-t-0 first:pt-0">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--well)] text-[var(--ink2)]" aria-hidden="true">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <b className="text-[13px] font-medium">{title}</b>
          {badge ? (
            <span className="status-mark" data-tone="ok">
              <span className="status-mark__dot" aria-hidden="true" />
              {badge}
            </span>
          ) : null}
        </span>
        <span className="mt-0.5 block break-words text-[11.5px] leading-[1.5] text-[var(--ink2)]">
          {detail}
        </span>
      </div>
      {action ? <div className="ms-12 shrink-0 sm:ms-0">{action}</div> : null}
    </li>
  );
}
