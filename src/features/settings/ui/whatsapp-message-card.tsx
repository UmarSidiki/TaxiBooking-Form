"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { WhatsAppTemplateFields } from "@/features/settings/ui/whatsapp-template-fields";
import { WhatsAppTestSend } from "@/features/settings/ui/whatsapp-test-send";
import type { WhatsAppDeskTemplate } from "@/features/settings/ui/whatsapp-desk-types";
import { usePathname, useRouter } from "@/shared/i18n/navigation";
import { apiDelete, apiPatch, apiPost } from "@/shared/http/api";

const emptyBody =
  "Hello {{name}}, your ride {{tripId}} from {{pickup}} to {{dropoff}} is confirmed for {{date}} {{time}}.";

function blank(audience: "customer" | "desk", locale: string): WhatsAppDeskTemplate {
  return { _id: "", audience, locale, body: emptyBody, enabled: false };
}

export function WhatsAppMessageCard({
  templates,
  audience,
  locale,
  companyPhone,
  onChange,
}: {
  templates: WhatsAppDeskTemplate[];
  audience: "customer" | "desk";
  locale: string;
  companyPhone: string;
  onChange: () => Promise<void>;
}) {
  const t = useTranslations("Dashboard.Settings");
  const pathname = usePathname();
  const router = useRouter();
  const matches = templates.filter((item) => item.audience === audience && item.locale === locale);
  const saved = matches.find((item) => item.enabled) ?? matches[0];
  const [draft, setDraft] = useState<WhatsAppDeskTemplate>(saved ?? blank(audience, locale));
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(saved ?? blank(audience, locale));
  }, [saved, audience, locale]);

  const save = async () => {
    setSaving(true);
    setNotice(null);
    try {
      const payload = {
        audience,
        locale,
        body: draft.body,
        enabled: draft.enabled,
      };
      if (draft._id) {
        await apiPatch("/api/settings/whatsapp/templates", { id: draft._id, ...payload });
      } else {
        await apiPost("/api/settings/whatsapp/templates", payload);
      }
      setNotice(t("whatsapp_template_saved"));
      await onChange();
    } catch {
      setNotice(t("whatsapp_save_failed"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!draft._id || !window.confirm(t("whatsapp_delete_confirm"))) return;
    setSaving(true);
    try {
      await apiDelete(`/api/settings/whatsapp/templates?id=${draft._id}`);
      router.replace(`${pathname}?lang=${locale}`);
      await onChange();
    } catch {
      setNotice(t("whatsapp_save_failed"));
    } finally {
      setSaving(false);
    }
  };

  const title = audience === "customer" ? t("whatsapp_passenger_title") : t("whatsapp_desk_title");
  const help = audience === "customer" ? t("whatsapp_passenger_help") : t("whatsapp_desk_help");

  return (
    <article className="flex flex-col gap-4 rounded-md border border-border bg-background p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <p className="max-w-xl text-sm text-pretty text-muted-foreground">{help}</p>
        </div>
        <p className="text-sm font-medium">{saved?.enabled ? t("whatsapp_in_use") : t("whatsapp_not_in_use")}</p>
      </div>
      <WhatsAppTemplateFields
        draft={draft}
        setDraft={setDraft}
        companyPhone={companyPhone}
        saving={saving}
        notice={notice}
        onSave={() => void save()}
        onDelete={() => void remove()}
      />
      <div className="border-t border-border pt-4">
        <WhatsAppTestSend templateId={draft._id} fieldId={`whatsapp-test-${audience}`} />
      </div>
    </article>
  );
}
