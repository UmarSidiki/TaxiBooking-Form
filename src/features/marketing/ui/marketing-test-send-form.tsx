"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { apiPost } from "@/shared/http/api";
import { CUSTOMER_LOCALES } from "@/features/customers-admin/schema/customer-list.schema";
import type { MarketingTemplate } from "@/features/marketing/ui/marketing-ui.types";

type Outcome = { sent: boolean; channel: string; recipient: string };

export function MarketingTestSendForm({
  templates,
}: {
  templates: MarketingTemplate[];
}) {
  const t = useTranslations("MarketingDesk");
  const [templateId, setTemplateId] = useState("");
  const [recipient, setRecipient] = useState("");
  const [locale, setLocale] = useState("en");
  const [pending, setPending] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    if (!templateId || !recipient.trim()) return;
    setPending(true);
    setError(null);
    setOutcome(null);
    try {
      const data = await apiPost<
        { success: true } & Outcome
      >(`/api/admin/marketing/templates/${templateId}/test-send`, {
        recipient: recipient.trim(),
        locale,
      });
      setOutcome({
        sent: data.sent,
        channel: data.channel,
        recipient: data.recipient,
      });
    } catch {
      setError(t("test-failed"));
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="desk-card flex flex-col gap-4 rounded-md border border-border bg-card p-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          {t("test-send-title")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("test-send-desc")}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="test-template">{t("template")}</Label>
          <Select value={templateId} onValueChange={setTemplateId}>
            <SelectTrigger id="test-template" className="h-11 w-full">
              <SelectValue placeholder={t("choose-template")} />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="test-recipient">{t("test-recipient")}</Label>
          <Input
            id="test-recipient"
            name="test-recipient"
            autoComplete="off"
            value={recipient}
            placeholder={t("test-recipient-placeholder")}
            onChange={(event) => setRecipient(event.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="test-locale">{t("locale")}</Label>
          <Select value={locale} onValueChange={setLocale}>
            <SelectTrigger id="test-locale" className="h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CUSTOMER_LOCALES.map((value) => (
                <SelectItem key={value} value={value}>
                  {value.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          className="min-h-11"
          disabled={pending || !templateId || !recipient.trim()}
          onClick={() => void send()}
        >
          {pending ? t("sending") : t("send-test")}
        </Button>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        {outcome ? (
          <p role="status" className="text-sm text-muted-foreground">
            {outcome.sent ? t("test-sent") : t("test-not-sent")}
          </p>
        ) : null}
      </div>

      <p className="text-sm text-muted-foreground">{t("allowlist-note")}</p>
    </section>
  );
}
