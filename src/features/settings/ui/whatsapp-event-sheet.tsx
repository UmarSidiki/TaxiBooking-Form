"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import {
  notificationLocale,
  notificationLocales,
  type NotificationLocale,
} from "@/features/notifications/notification-types";
import type { RegistryEventRow } from "@/features/settings/lib/whatsapp-registry-types";
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

type Draft = { body: string; custom: boolean };

function draftsFrom(row: RegistryEventRow): Record<string, Draft> {
  return Object.fromEntries(
    notificationLocales.map((code) => [
      code,
      { body: row.templates[code].body, custom: row.templates[code].custom },
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
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const languageNames = new Intl.DisplayNames([uiLocale], { type: "language" });
  const current = drafts[locale];
  const name = t(`notify_event_${row.key}_name`);

  const send = async (action: "template" | "reset") => {
    setSaving(true);
    setNotice(null);
    setError(false);
    try {
      await apiPatch("/api/settings/whatsapp/events", {
        action,
        event: row.key,
        audience: row.audience,
        locale,
        ...(action === "template" ? { body: current.body } : {}),
      });
      setDrafts((prev) => ({
        ...prev,
        [locale]:
          action === "template"
            ? { body: current.body, custom: true }
            : { body: row.defaults[locale], custom: false },
      }));
      setNotice(action === "template" ? t("notify_message_saved") : t("notify_reset_done"));
      onChanged();
    } catch {
      setError(true);
    } finally {
      setSaving(false);
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
              <TabsContent key={code} value={code} className="mt-3">
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
              </TabsContent>
            ))}
          </Tabs>
          <p className="text-xs text-muted-foreground">
            {current.custom ? t("notify_custom_help") : t("notify_default_help")}
          </p>
          {notice || error ? (
            <p
              role="status"
              aria-live="polite"
              className={`text-sm ${error ? "text-destructive" : "text-muted-foreground"}`}
            >
              {error ? t("whatsapp_save_failed") : notice}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              className="h-11"
              disabled={saving || !current.body.trim()}
              onClick={() => void send("template")}
            >
              {saving ? t("whatsapp_saving") : t("notify_save_message")}
            </Button>
            {current.custom ? (
              <Button
                type="button"
                variant="outline"
                className="h-11"
                disabled={saving}
                onClick={() => void send("reset")}
              >
                {t("notify_reset")}
              </Button>
            ) : null}
          </div>
          <div className="border-t border-border pt-4">
            <WhatsAppTestSend
              target={{ event: row.key, audience: row.audience, locale }}
              fieldId={`notify-test-${row.key}-${row.audience}`}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
