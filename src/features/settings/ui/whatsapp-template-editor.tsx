"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";

import {
  renderWhatsAppTemplate,
  whatsappSampleValues,
} from "@/features/settings/lib/whatsapp-template-text";
import type { NotificationLocale } from "@/features/notifications/notification-types";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";

export function WhatsAppTemplateEditor({
  body,
  onChange,
  variables,
  companyPhone,
  locale,
}: {
  body: string;
  onChange: (body: string) => void;
  variables: string[];
  companyPhone: string;
  locale: NotificationLocale;
}) {
  const t = useTranslations("Dashboard.Settings");
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const preview = renderWhatsAppTemplate(body, {
    ...whatsappSampleValues,
    companyPhone: companyPhone || whatsappSampleValues.companyPhone,
  });

  const insert = (token: string) => {
    const field = bodyRef.current;
    const focused = field !== null && document.activeElement === field;
    const start = focused ? field.selectionStart : body.length;
    const end = focused ? field.selectionEnd : start;
    const snippet = `{{${token}}}`;
    onChange(`${body.slice(0, start)}${snippet}${body.slice(end)}`);
    window.requestAnimationFrame(() => {
      field?.focus();
      field?.setSelectionRange(start + snippet.length, start + snippet.length);
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label htmlFor={`notify-body-${locale}`} className="mb-2 block text-sm font-medium">
          {t("whatsapp_body")}
        </label>
        <Textarea
          id={`notify-body-${locale}`}
          name={`body-${locale}`}
          ref={bodyRef}
          value={body}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-32 text-base sm:text-sm"
        />
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">{t("notify_variables")}</p>
        <p className="text-xs text-muted-foreground">{t("notify_variables_help")}</p>
        <div className="flex flex-wrap gap-2">
          {variables.map((token) => (
            <Button
              key={token}
              type="button"
              variant="outline"
              className="h-11"
              onClick={() => insert(token)}
            >
              <span translate="no">{`{{${token}}}`}</span>
            </Button>
          ))}
        </div>
      </div>
      <div>
        <p id={`notify-preview-label-${locale}`} className="mb-2 text-sm font-medium">
          {t("whatsapp_preview")}
        </p>
        <p
          id={`notify-preview-${locale}`}
          aria-labelledby={`notify-preview-label-${locale}`}
          className="whitespace-pre-wrap rounded-md border border-border bg-background p-4 text-sm text-pretty"
        >
          {preview}
        </p>
      </div>
    </div>
  );
}
