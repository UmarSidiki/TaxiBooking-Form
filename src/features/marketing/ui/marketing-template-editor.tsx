"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { CUSTOMER_LOCALES } from "@/features/customers-admin/schema/customer-list.schema";
import type {
  MarketingTemplate,
  MarketingTemplateLocale,
} from "@/features/marketing/ui/marketing-ui.types";
import type { CampaignTemplateWriteInput } from "@/features/marketing/schema/campaign-template.schema";
import {
  EMPTY_TEMPLATE_LOCALE,
  draftFromTemplate,
  draftVariables,
  localesForSave,
  type MarketingTemplateDraft,
} from "@/features/marketing/ui/marketing-template-draft";
import { MarketingTemplateActions } from "@/features/marketing/ui/marketing-template-actions";

export function MarketingTemplateEditor({
  template,
  onSave,
  onCancel,
}: {
  template: MarketingTemplate | null;
  onSave: (input: CampaignTemplateWriteInput) => Promise<void>;
  onCancel: () => void;
}) {
  const t = useTranslations("MarketingDesk");
  const [draft, setDraft] = useState<MarketingTemplateDraft>(() =>
    draftFromTemplate(template),
  );
  const [locale, setLocale] = useState("en");
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setDraft(draftFromTemplate(template));
    setLocale("en");
    setFailed(false);
  }, [template]);

  const content = draft.locales[locale] ?? EMPTY_TEMPLATE_LOCALE;
  const variables = draftVariables(draft.locales);

  function updateContent(patch: Partial<MarketingTemplateLocale>) {
    setDraft((prev) => ({
      ...prev,
      locales: {
        ...prev.locales,
        [locale]: {
          ...(prev.locales[locale] ?? EMPTY_TEMPLATE_LOCALE),
          ...patch,
        },
      },
    }));
  }

  async function submit() {
    const locales = localesForSave(draft.locales);
    setPending(true);
    setFailed(false);
    try {
      await onSave({ channel: draft.channel, name: draft.name, locales });
    } catch {
      setFailed(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded border border-border/60 p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="template-name">{t("template-name")}</Label>
          <Input
            id="template-name"
            name="template-name"
            value={draft.name}
            maxLength={120}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, name: event.target.value }))
            }
          />
        </div>
        <div>
          <Label htmlFor="template-channel">{t("channel")}</Label>
          <Select
            value={draft.channel}
            onValueChange={(value) =>
              setDraft((prev) => ({
                ...prev,
                channel: value as MarketingTemplateDraft["channel"],
              }))
            }
          >
            <SelectTrigger id="template-channel" className="h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="email">{t("channel-email")}</SelectItem>
              <SelectItem value="whatsapp">{t("channel-whatsapp")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="template-locale">{t("locale")}</Label>
        <Select value={locale} onValueChange={setLocale}>
          <SelectTrigger id="template-locale" className="h-11 w-full">
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

      {draft.channel === "email" ? (
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="template-subject">{t("subject")}</Label>
            <Input
              id="template-subject"
              name="template-subject"
              value={content.subject}
              maxLength={200}
              onChange={(event) =>
                updateContent({ subject: event.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="template-preheader">{t("preheader")}</Label>
            <Input
              id="template-preheader"
              name="template-preheader"
              value={content.preheader}
              maxLength={300}
              onChange={(event) =>
                updateContent({ preheader: event.target.value })
              }
            />
          </div>
        </div>
      ) : null}

      <div>
        <Label htmlFor="template-body">{t("body")}</Label>
        <p className="mb-2 text-sm text-muted-foreground">{t("body-hint")}</p>
        <Textarea
          id="template-body"
          name="template-body"
          rows={6}
          value={content.body}
          onChange={(event) => updateContent({ body: event.target.value })}
        />
      </div>

      <p className="text-sm text-muted-foreground">
        {t("variables", {
          list: variables.length > 0 ? variables.join(", ") : t("none"),
        })}
      </p>

      <MarketingTemplateActions
        pending={pending}
        failed={failed}
        canSave={Boolean(draft.name.trim())}
        onSave={() => void submit()}
        onCancel={onCancel}
      />
    </div>
  );
}
