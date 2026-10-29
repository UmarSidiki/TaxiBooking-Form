"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";

import {
  renderWhatsAppTemplate,
  whatsappSampleValues,
} from "@/features/settings/lib/whatsapp-template-text";
import type { NotificationLocale } from "@/features/notifications/notification-types";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";

export function EmailTemplateEditor({
  subject,
  body,
  onChange,
  variables,
  locale,
}: {
  subject: string;
  body: string;
  onChange: (value: { subject: string; body: string }) => void;
  variables: string[];
  locale: NotificationLocale;
}) {
  const t = useTranslations("Dashboard.Settings");
  const subjectRef = useRef<HTMLTextAreaElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const insert = (token: string) => {
    const field =
      document.activeElement === subjectRef.current
        ? subjectRef.current
        : bodyRef.current;
    const current = field === subjectRef.current ? subject : body;
    const setter = (next: string) =>
      field === subjectRef.current
        ? onChange({ subject: next, body })
        : onChange({ subject, body: next });
    const start = field ? field.selectionStart : current.length;
    const end = field ? field.selectionEnd : start;
    const snippet = `{{${token}}}`;
    setter(`${current.slice(0, start)}${snippet}${current.slice(end)}`);
    window.requestAnimationFrame(() => {
      field?.focus();
      field?.setSelectionRange(start + snippet.length, start + snippet.length);
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label htmlFor={`notify-email-subject-${locale}`} className="mb-2 block text-sm font-medium">
          {t("notify_email_subject")}
        </label>
        <Input
          id={`notify-email-subject-${locale}`}
          name={`email-subject-${locale}`}
          value={subject}
          onChange={(event) => onChange({ subject: event.target.value, body })}
          className="h-11 text-base sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor={`notify-email-body-${locale}`} className="mb-2 block text-sm font-medium">
          {t("notify_email_intro")}
        </label>
        <Textarea
          id={`notify-email-body-${locale}`}
          name={`email-body-${locale}`}
          ref={bodyRef}
          value={body}
          onChange={(event) => onChange({ subject, body: event.target.value })}
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
        <p id={`notify-email-preview-label-${locale}`} className="mb-2 text-sm font-medium">
          {t("notify_email_preview")}
        </p>
        <div
          aria-labelledby={`notify-email-preview-label-${locale}`}
          className="rounded-md border border-border bg-background p-4"
        >
          <p className="mb-2 text-sm font-semibold">
            {renderWhatsAppTemplate(subject, {
              ...whatsappSampleValues,
              ...Object.fromEntries(variables.map((token) => [token, `{{${token}}}`])),
            })}
          </p>
          <p className="whitespace-pre-wrap text-sm text-pretty text-muted-foreground">
            {renderWhatsAppTemplate(body, whatsappSampleValues)}
          </p>
        </div>
      </div>
    </div>
  );
}
