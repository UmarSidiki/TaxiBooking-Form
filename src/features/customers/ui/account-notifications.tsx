"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { BellRing, Check, Lock, Mail, MessageCircle, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { Switch } from "@/shared/ui/switch";
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

type Channel = "email" | "whatsapp";

const BENEFIT_KEYS = ["offers-benefit-deals", "offers-benefit-news", "offers-benefit-tips"] as const;

function formatSince(value: unknown, locale: string) {
  if (!value) return "";
  const date = new Date(value as string);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(date);
}

export function AccountNotifications({
  t,
  locale,
  profile,
  marketingEnabled = true,
  onSaved,
}: {
  t: AccountT;
  locale: string;
  profile: CustomerProfile | null;
  /** Marketing module switch: off hides the offers opt-in (consent is kept). */
  marketingEnabled?: boolean;
  onSaved: (profile: CustomerProfile) => void;
}) {
  const marketingT = useTranslations("Marketing");
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmOff, setConfirmOff] = useState<Channel | null>(null);

  const rideWhatsapp = profile?.whatsappOptIn ?? true;
  const granted = {
    email: profile?.marketing?.email?.status === "granted",
    whatsapp: profile?.marketing?.whatsapp?.status === "granted",
  };
  const anyGranted = granted.email || granted.whatsapp;
  const phone = profile?.verifiedPhone ?? "";

  const patch = async (key: string, body: Record<string, unknown>, message: string) => {
    setBusy(key);
    setNotice(null);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setNotice(t("save-failed"));
        return false;
      }
      const data = await res.json();
      if (data.profile) onSaved(data.profile);
      setNotice(message);
      return true;
    } finally {
      setBusy(null);
    }
  };

  const setMarketing = (channel: Channel, on: boolean) =>
    patch(
      channel,
      channel === "email" ? { marketingEmailOptIn: on } : { marketingWhatsappOptIn: on },
      on ? t("offers-on-notice") : t("offers-off-notice"),
    );

  const toggleMarketing = (channel: Channel, on: boolean) => {
    if (on) void setMarketing(channel, true);
    else setConfirmOff(channel);
  };

  return (
    <>
      <AccountPageHeader title={t("nav-notifications")} subtitle={t("notifications-subtitle")} />

      {notice ? (
        <p role="status" className="mb-3 text-xs text-[var(--ink2)]">
          {notice}
        </p>
      ) : null}

      <div className="grid gap-4">
        <AccountCard
          id="ride-updates"
          title={t("ride-updates-title")}
          description={t("ride-updates-copy")}
        >
          <ul className="m-0 grid list-none gap-0 p-0">
            <ChannelRow
              icon={<Mail className="size-[18px]" strokeWidth={1.7} />}
              title={t("email")}
              hint={t("ride-updates-email-hint")}
              control={
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--well)] px-2.5 py-1 text-[11px] font-medium text-[var(--ink2)]">
                  <Lock className="size-3" aria-hidden="true" />
                  {t("always-on")}
                </span>
              }
            />
            <ChannelRow
              icon={<MessageCircle className="size-[18px]" strokeWidth={1.7} />}
              title={t("whatsapp")}
              titleId="ride-whatsapp-label"
              hint={phone ? t("ride-updates-whatsapp-to", { phone }) : t("ride-updates-whatsapp-hint")}
              control={
                <Switch
                  checked={rideWhatsapp}
                  disabled={busy !== null}
                  aria-labelledby="ride-whatsapp-label"
                  onCheckedChange={(on) =>
                    void patch("ride", { whatsappOptIn: on }, t("saved"))
                  }
                />
              }
            />
          </ul>
        </AccountCard>

        {marketingEnabled ? (
          <section
            id="offers"
            aria-labelledby="offers-title"
            className="scroll-mt-24 overflow-hidden rounded-[var(--radius)] border border-[var(--rule)] bg-[var(--sheet)]"
          >
            <div
              className={`p-4 md:p-6 ${
                anyGranted ? "" : "bg-[linear-gradient(135deg,var(--well),var(--sheet)_70%)]"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full border border-[var(--rule)] bg-[var(--sheet)] text-[var(--ink)]">
                  {anyGranted ? (
                    <BellRing className="size-[18px]" strokeWidth={1.7} aria-hidden="true" />
                  ) : (
                    <Sparkles className="size-[18px]" strokeWidth={1.7} aria-hidden="true" />
                  )}
                </span>
                <div className="min-w-0">
                  <h2 id="offers-title" className="m-0 text-[15px] font-semibold md:text-[17px]">
                    {anyGranted ? t("offers-title-subscribed") : t("offers-title")}
                  </h2>
                  <p className="mt-1 text-xs leading-[1.6] text-[var(--ink2)] md:text-[13px]">
                    {anyGranted ? t("offers-copy-subscribed") : t("offers-copy")}
                  </p>
                </div>
              </div>

              {anyGranted ? null : (
                <>
                  <ul className="m-0 mt-4 grid list-none gap-2 p-0 sm:grid-cols-3">
                    {BENEFIT_KEYS.map((key) => (
                      <li
                        key={key}
                        className="flex items-start gap-2 rounded-[var(--radius)] border border-[var(--rule)] bg-[var(--sheet)] p-3 text-xs leading-[1.5]"
                      >
                        <Check className="mt-px size-3.5 shrink-0 text-[var(--ok)]" aria-hidden="true" />
                        {t(key)}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <AccountButton
                      type="button"
                      variant="primary"
                      disabled={busy !== null}
                      onClick={() => void setMarketing("email", true)}
                    >
                      <Mail className="size-4" aria-hidden="true" />
                      {t("offers-cta-email")}
                    </AccountButton>
                    <span className="text-[11px] text-[var(--ink2)]">{t("offers-fineprint")}</span>
                  </div>
                </>
              )}
            </div>

            <ul className="m-0 grid list-none gap-0 border-t border-[var(--rule)] p-0 px-4 md:px-6">
              <ChannelRow
                icon={<Mail className="size-[18px]" strokeWidth={1.7} />}
                title={marketingT("account-email")}
                titleId="offers-email-label"
                hint={
                  granted.email
                    ? t("subscribed-since", {
                        date: formatSince(profile?.marketing?.email?.at, locale),
                      })
                    : marketingT("account-note")
                }
                control={
                  <Switch
                    checked={granted.email}
                    disabled={busy !== null}
                    aria-labelledby="offers-email-label"
                    onCheckedChange={(on) => toggleMarketing("email", on)}
                  />
                }
              />
              <ChannelRow
                icon={<MessageCircle className="size-[18px]" strokeWidth={1.7} />}
                title={marketingT("account-whatsapp")}
                titleId="offers-whatsapp-label"
                hint={
                  granted.whatsapp
                    ? t("subscribed-since", {
                        date: formatSince(profile?.marketing?.whatsapp?.at, locale),
                      })
                    : marketingT("account-whatsapp-hint")
                }
                extra={
                  !phone ? (
                    <Link
                      href={accountHref(locale, "profile", "phone")}
                      className="mt-1 inline-block text-[11.5px] text-[var(--link)] hover:underline"
                    >
                      {t("add-whatsapp-number")}
                    </Link>
                  ) : null
                }
                control={
                  <Switch
                    checked={granted.whatsapp}
                    disabled={busy !== null}
                    aria-labelledby="offers-whatsapp-label"
                    onCheckedChange={(on) => toggleMarketing("whatsapp", on)}
                  />
                }
              />
            </ul>
          </section>
        ) : null}
      </div>

      <Dialog open={confirmOff !== null} onOpenChange={(open) => !open && setConfirmOff(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto pb-[max(1rem,env(safe-area-inset-bottom))]">
          <DialogHeader>
            <DialogTitle>
              {confirmOff === "whatsapp" ? t("offers-off-title-whatsapp") : t("offers-off-title-email")}
            </DialogTitle>
            <DialogDescription>{t("offers-off-copy")}</DialogDescription>
          </DialogHeader>
          <ul className="m-0 grid list-none gap-2 p-0 text-sm">
            {BENEFIT_KEYS.map((key) => (
              <li key={key} className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-[var(--ok)]" aria-hidden="true" />
                {t(key)}
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">{t("offers-off-ride-note")}</p>
          <DialogFooter className="gap-2">
            <AccountButton type="button" variant="outline" onClick={() => setConfirmOff(null)}>
              {t("offers-keep")}
            </AccountButton>
            <AccountButton
              type="button"
              variant="primary"
              disabled={busy !== null}
              onClick={async () => {
                const channel = confirmOff;
                if (!channel) return;
                await setMarketing(channel, false);
                setConfirmOff(null);
              }}
            >
              {t("offers-turn-off")}
            </AccountButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ChannelRow({
  icon,
  title,
  titleId,
  hint,
  extra,
  control,
}: {
  icon: ReactNode;
  title: string;
  titleId?: string;
  hint: string;
  extra?: ReactNode;
  control: ReactNode;
}) {
  return (
    <li className="flex items-center gap-3 border-t border-[var(--rule)] py-3.5 first:border-t-0">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--well)] text-[var(--ink2)]" aria-hidden="true">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <b id={titleId} className="block text-[13px] font-medium">
          {title}
        </b>
        <span className="mt-0.5 block text-[11.5px] leading-[1.5] text-[var(--ink2)]">{hint}</span>
        {extra}
      </div>
      <div className="shrink-0">{control}</div>
    </li>
  );
}
