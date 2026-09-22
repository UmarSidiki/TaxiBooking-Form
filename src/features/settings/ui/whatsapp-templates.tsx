"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

import type { WhatsAppDeskTemplate } from "@/features/settings/ui/whatsapp-desk-types";
import { WhatsAppTemplateFields } from "@/features/settings/ui/whatsapp-template-fields";
import { usePathname, useRouter } from "@/shared/i18n/navigation";
import { apiDelete, apiPatch, apiPost } from "@/shared/http/api";
import { Button } from "@/shared/ui/button";

const blank = (): WhatsAppDeskTemplate => ({
  _id: "",
  audience: "customer",
  locale: "en",
  body: "Hello {{name}}, your ride {{tripId}} from {{pickup}} to {{dropoff}} is confirmed for {{date}} {{time}}.",
  enabled: false,
});

export function WhatsAppTemplates({
  templates,
  companyPhone,
  onChange,
}: {
  templates: WhatsAppDeskTemplate[];
  companyPhone: string;
  onChange: () => Promise<void>;
}) {
  const t = useTranslations("Dashboard.Settings");
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const selectedId = params.get("template") ?? "";
  const [draft, setDraft] = useState<WhatsAppDeskTemplate>(blank);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const next = templates.find((item) => item._id === selectedId) ?? blank();
    setDraft(next);
  }, [selectedId, templates]);

  const select = (id: string) => {
    setNotice(null);
    router.replace(`${pathname}?template=${id || "new"}`);
  };

  const save = async () => {
    setSaving(true);
    setNotice(null);
    try {
      const payload = {
        audience: draft.audience,
        locale: draft.locale,
        body: draft.body,
        enabled: draft.enabled,
      };
      if (draft._id) {
        await apiPatch("/api/settings/whatsapp/templates", { id: draft._id, ...payload });
      } else {
        const created = await apiPost<{ success: boolean; data: { _id: string } }>(
          "/api/settings/whatsapp/templates",
          payload
        );
        await onChange();
        if (created.data?._id) router.replace(`${pathname}?template=${created.data._id}`);
        setNotice(t("whatsapp_template_saved"));
        return;
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
      setDraft(blank());
      router.replace(`${pathname}?template=new`);
      await onChange();
    } catch {
      setNotice(t("whatsapp_save_failed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" className="h-11" onClick={() => select("")}>
          {t("whatsapp_new_template")}
        </Button>
        {templates.map((item) => (
          <Button
            key={item._id}
            type="button"
            variant={item._id === draft._id ? "default" : "outline"}
            className="h-11 max-w-full"
            onClick={() => select(item._id)}
          >
            <span className="truncate">
              {item.audience === "customer" ? t("whatsapp_audience_customer") : t("whatsapp_audience_desk")}
              {" · "}
              <span translate="no">{item.locale}</span>
            </span>
          </Button>
        ))}
      </div>
      {templates.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("whatsapp_template_empty")}</p>
      ) : null}
      <WhatsAppTemplateFields
        draft={draft}
        setDraft={setDraft}
        companyPhone={companyPhone}
        saving={saving}
        notice={notice}
        onSave={() => void save()}
        onDelete={() => void remove()}
      />
    </div>
  );
}
