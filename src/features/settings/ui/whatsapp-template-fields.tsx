"use client";

import { useRef, type Dispatch, type SetStateAction } from "react";
import { useTranslations } from "next-intl";

import { whatsappVariables } from "@/features/settings/schema/whatsapp.schema";
import {
  renderWhatsAppTemplate,
  whatsappSampleValues,
} from "@/features/settings/lib/whatsapp-template-text";
import type { WhatsAppDeskTemplate } from "@/features/settings/ui/whatsapp-desk-types";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";

export function WhatsAppTemplateFields({
  draft,
  setDraft,
  companyPhone,
  saving,
  notice,
  onSave,
  onDelete,
}: {
  draft: WhatsAppDeskTemplate;
  setDraft: Dispatch<SetStateAction<WhatsAppDeskTemplate>>;
  companyPhone: string;
  saving: boolean;
  notice: string | null;
  onSave: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations("Dashboard.Settings");
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const preview = renderWhatsAppTemplate(draft.body, {
    ...whatsappSampleValues,
    companyPhone: companyPhone || whatsappSampleValues.companyPhone,
  });

  const insert = (token: string) => {
    const field = bodyRef.current;
    const snippet = `{{${token}}}`;
    const start = field?.selectionStart ?? draft.body.length;
    const end = field?.selectionEnd ?? start;
    const body = `${draft.body.slice(0, start)}${snippet}${draft.body.slice(end)}`;
    setDraft((prev) => ({ ...prev, body }));
  };

  return (
    <div className="flex flex-col gap-4">
      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input
          type="checkbox"
          className="size-4 accent-primary focus-visible:ring-2 focus-visible:ring-ring"
          checked={draft.enabled}
          onChange={(event) => setDraft((prev) => ({ ...prev, enabled: event.target.checked }))}
        />
        {t("whatsapp_enabled_template")}
      </label>
      <div>
        <label htmlFor={`whatsapp-body-${draft.audience}`} className="mb-2 block text-sm font-medium">
          {t("whatsapp_body")}
        </label>
        <Textarea
          id={`whatsapp-body-${draft.audience}`}
          ref={bodyRef}
          name={`body-${draft.audience}`}
          value={draft.body}
          onChange={(event) => setDraft((prev) => ({ ...prev, body: event.target.value }))}
          className="min-h-32"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {whatsappVariables.map((token) => (
          <Button key={token} type="button" variant="outline" className="h-11" onClick={() => insert(token)}>
            <span translate="no">{`{{${token}}}`}</span>
          </Button>
        ))}
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">{t("whatsapp_preview")}</p>
        <p className="whitespace-pre-wrap rounded-md border border-border bg-background p-4 text-sm text-pretty">
          {preview}
        </p>
      </div>
      {notice ? (
        <p role="status" aria-live="polite" className="text-sm">
          {notice}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button type="button" className="h-11" onClick={onSave} disabled={saving || !draft.body.trim()}>
          {saving ? t("whatsapp_saving") : t("whatsapp_save_template")}
        </Button>
        {draft._id ? (
          <Button type="button" variant="outline" className="h-11" onClick={onDelete} disabled={saving}>
            {t("whatsapp_delete_template")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
