"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import {
  notificationLocale,
  notificationLocales,
  type NotificationLocale,
} from "@/features/notifications/notification-types";
import type { RegistryEventRow } from "@/features/settings/lib/whatsapp-registry-types";
import { EmailTemplateEditor } from "@/features/settings/ui/email-template-editor";
import { WhatsAppTemplateEditor } from "@/features/settings/ui/whatsapp-template-editor";
import { WhatsAppTestSend } from "@/features/settings/ui/whatsapp-test-send";
import { apiPatch } from "@/shared/http/api";
import { Button } from "@/shared/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/shared/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

type Channel = "whatsapp" | "email";
type Draft = { body: string; custom: boolean };
type EmailDraft = { subject: string; body: string; custom: boolean };

function draftsFrom(row: RegistryEventRow): Record<string, Draft> {
  return Object.fromEntries(
    notificationLocales.map((code) => [
      code,
      { body: row.templates[code].body, custom: row.templates[code].custom },
    ]),
  );
}

function emailDraftsFrom(row: RegistryEventRow): Record<string, EmailDraft> {
  return Object.fromEntries(
    notificationLocales.map((code) => [
      code,
      {
        subject: row.emailTemplates[code].subject,
        body: row.emailTemplates[code].body,
        custom: row.emailTemplates[code].custom,
      },
    ]),
  );
}

export function WhatsAppEventSheet({
  row,
  companyPhone,
  defaultLocale,
  onClose,
  onChanged,
}: {
  row: RegistryEventRow;
  companyPhone: string;
  defaultLocale: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const t = useTranslations("Dashboard.Settings");
  const uiLocale = useLocale();
  const [locale, setLocale] = useState<NotificationLocale>(() => notificationLocale(defaultLocale));
  const [drafts, setDrafts] = useState(() => draftsFrom(row));
  const [emailDrafts, setEmailDrafts] = useState(() => emailDraftsFrom(row));
  const [saving, setSaving] = useState<Channel | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const languageNames = new Intl.DisplayNames([uiLocale], { type: "language" });
  const hasWhatsApp = row.channels.some((item) => item.channel === "whatsapp");
  const hasEmail = row.channels.some((item) => item.channel === "email");
  const current = drafts[locale];
  const currentEmail = emailDrafts[locale];
  const name = t(`notify_event_${row.key}_name`);

  const send = async (channel: Channel, action: "template" | "reset") => {
    setSaving(channel);
    setNotice(null);
    setError(false);
    try {
      await apiPatch("/api/settings/whatsapp/events", {
        action,
        event: row.key,
        audience: row.audience,
        channel,
        locale,
        ...(action === "template"
          ? channel === "email"
            ? { subject: currentEmail.subject, body: currentEmail.body }
            : { body: current.body }
          : {}),
      });
      if (channel === "whatsapp") {
        setDrafts((prev) => ({
          ...prev,
          [locale]:
            action === "template"
              ? { body: current.body, custom: true }
              : { body: row.defaults[locale], custom: false },
        }));
      } else {
        setEmailDrafts((prev) => ({
          ...prev,
          [locale]:
            action === "template"
              ? { ...currentEmail, custom: true }
              : { ...row.emailDefaults[locale], custom: false },
        }));
      }
      setNotice(action === "template" ? t("notify_message_saved") : t("notify_reset_done"));
      onChanged();
    } catch {
      setError(true);
    } finally {
      setSaving(null);
    }
  };

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-xl">
        <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <SheetHeader className="p-0 pe-10">
            <SheetTitle>{t("notify_edit_title")}</SheetTitle>
            <SheetDescription>
              {name} · {t(`notify_group_${row.audience}`)}
            </SheetDescription>
          </SheetHeader>
          <p className="text-xs text-muted-foreground">{t("notify_edit_help")}</p>
          <Tabs
            value={locale}
            onValueChange={(value) => {
              setLocale(notificationLocale(value));
              setNotice(null);
              setError(false);
            }}
          >
            <TabsList className="h-auto w-full justify-start overflow-x-auto">
              {notificationLocales.map((code) => (
                <TabsTrigger key={code} value={code} className="min-h-11 min-w-[4.5rem]">
                  {languageNames.of(code) ?? code}
                </TabsTrigger>
              ))}
            </TabsList>
            {notificationLocales.map((code) => (
              <TabsContent key={code} value={code} className="mt-3 flex flex-col gap-4">
                {hasWhatsApp ? (
                  <section className="flex flex-col gap-3">
                    <h3 className="text-sm font-semibold">{t("notify_channel_whatsapp")}</h3>
                    <WhatsAppTemplateEditor
                      locale={code}
                      body={drafts[code].body}
                      variables={row.variables}
                      companyPhone={companyPhone}
                      onChange={(body) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [code]: { ...prev[code], body },
                        }))
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      {drafts[code].custom ? t("notify_custom_help") : t("notify_default_help")}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        className="h-11"
                        disabled={saving !== null || !drafts[code].body.trim()}
                        onClick={() => void send("whatsapp", "template")}
                      >
                        {saving === "whatsapp" ? t("whatsapp_saving") : t("notify_save_message")}
                      </Button>
                      {drafts[code].custom ? (
                        <Button
                          type="button"
                          variant="outline"
                          className="h-11"
                          disabled={saving !== null}
                          onClick={() => void send("whatsapp", "reset")}
                        >
                          {t("notify_reset")}
                        </Button>
                      ) : null}
                    </div>
                  </section>
                ) : null}
                {hasEmail ? (
                  <section className="flex flex-col gap-3">
                    <h3 className="text-sm font-semibold">{t("notify_channel_email")}</h3>
                    <p className="text-xs text-muted-foreground">{t("notify_email_help")}</p>
                    <EmailTemplateEditor
                      locale={code}
                      subject={emailDrafts[code].subject}
                      body={emailDrafts[code].body}
                      variables={row.variables}
                      onChange={(value) =>
                        setEmailDrafts((prev) => ({
                          ...prev,
                          [code]: { ...prev[code], ...value },
                        }))
                      }
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        className="h-11"
                        disabled={saving !== null || !emailDrafts[code].body.trim()}
                        onClick={() => void send("email", "template")}
                      >
                        {saving === "email" ? t("whatsapp_saving") : t("notify_save_message")}
                      </Button>
                      {emailDrafts[code].custom ? (
                        <Button
                          type="button"
                          variant="outline"
                          className="h-11"
                          disabled={saving !== null}
                          onClick={() => void send("email", "reset")}
                        >
                          {t("notify_reset")}
                        </Button>
                      ) : null}
                    </div>
                  </section>
                ) : null}
              </TabsContent>
            ))}
          </Tabs>
          {notice || error ? (
            <p
              role="status"
              aria-live="polite"
              className={`text-sm ${error ? "text-destructive" : "text-muted-foreground"}`}
            >
              {error ? t("whatsapp_save_failed") : notice}
            </p>
          ) : null}
          {hasWhatsApp ? (
            <div className="border-t border-border pt-4">
              <WhatsAppTestSend
                target={{ event: row.key, audience: row.audience, locale }}
                fieldId={`notify-test-${row.key}-${row.audience}`}
              />
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
