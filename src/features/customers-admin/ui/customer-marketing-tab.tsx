"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";
import { DeskSelect } from "@/features/dashboard/ui/desk-select";
import { CustomerMarketingChannelCard } from "@/features/customers-admin/ui/customer-marketing-channel-card";
import { CustomerMarketingHistory } from "@/features/customers-admin/ui/customer-marketing-history";
import type { MarketingSnapshot } from "@/features/marketing/lib/consent/marketing-consent.types";
import { apiPost } from "@/shared/http/api";

type Channel = "email" | "whatsapp";
type Action = "withdraw" | "record_offline";

type Response = { success: boolean; data?: MarketingSnapshot };

export function CustomerMarketingTab({
  email,
  marketing,
  onChanged,
}: {
  email: string;
  marketing: MarketingSnapshot;
  onChanged: () => void;
}) {
  const t = useTranslations("MarketingAdmin");
  const locale = useLocale();
  const [channel, setChannel] = useState<Channel>("email");
  const [action, setAction] = useState<Action>("withdraw");
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setNotice(null);
    if (action === "record_offline" && reason.trim().length < 3) {
      setError(t("reason-required"));
      return;
    }
    setPending(true);
    try {
      await apiPost<Response>(
        `/api/admin/customers/${encodeURIComponent(email)}/marketing`,
        { channel, action, reason: reason.trim() },
      );
      setReason("");
      setNotice(action === "record_offline" ? t("recorded") : t("withdrawn"));
      onChanged();
    } catch {
      setError(t("failed"));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <CustomerMarketingChannelCard
          label={t("channel-email")}
          state={marketing.email}
          locale={locale}
        />
        <CustomerMarketingChannelCard
          label={t("channel-whatsapp")}
          state={marketing.whatsapp}
          locale={locale}
          hint={marketing.whatsappVerified ? undefined : t("whatsapp-unverified")}
        />
      </div>

      <section className="rounded border border-border/60 bg-card p-4">
        <h3 className="text-sm font-semibold">{t("admin-title")}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{t("admin-note")}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium" id="marketing-channel-label">
              {t("field-channel")}
            </label>
            <DeskSelect
              ariaLabel={t("field-channel")}
              value={channel}
              onValueChange={(value) => setChannel(value as Channel)}
              options={[
                { value: "email", label: t("channel-email") },
                { value: "whatsapp", label: t("channel-whatsapp") },
              ]}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium" id="marketing-action-label">
              {t("field-action")}
            </label>
            <DeskSelect
              ariaLabel={t("field-action")}
              value={action}
              onValueChange={(value) => setAction(value as Action)}
              options={[
                { value: "withdraw", label: t("action-withdraw") },
                { value: "record_offline", label: t("action-offline") },
              ]}
            />
          </div>
        </div>
        <div className="mt-3">
          <label htmlFor="marketing-reason" className="mb-1 block text-xs font-medium">
            {t("field-reason")}
          </label>
          <Textarea
            id="marketing-reason"
            value={reason}
            maxLength={500}
            onChange={(event) => setReason(event.target.value)}
            placeholder={t("reason-placeholder")}
            aria-required={action === "record_offline"}
          />
        </div>
        {error ? (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p role="status" className="mt-3 text-sm text-muted-foreground">
            {notice}
          </p>
        ) : null}
        <div className="mt-3 flex justify-end">
          <Button type="button" className="min-h-11" disabled={pending} onClick={() => void submit()}>
            {pending ? t("saving") : t("save")}
          </Button>
        </div>
      </section>

      <CustomerMarketingHistory history={marketing.history} locale={locale} />
    </div>
  );
}

