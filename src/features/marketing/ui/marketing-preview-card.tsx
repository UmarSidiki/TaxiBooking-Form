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
import { MarketingPreviewResult } from "@/features/marketing/ui/marketing-preview-result";
import type {
  MarketingSegment,
  MarketingTemplate,
  TemplatePreviewView,
} from "@/features/marketing/ui/marketing-ui.types";

export function MarketingPreviewCard({
  segments,
  templates,
}: {
  segments: MarketingSegment[];
  templates: MarketingTemplate[];
}) {
  const t = useTranslations("MarketingDesk");
  const [templateId, setTemplateId] = useState("");
  const [segmentId, setSegmentId] = useState("");
  const [email, setEmail] = useState("");
  const [locale, setLocale] = useState("en");
  const [preview, setPreview] = useState<TemplatePreviewView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function loadPreview() {
    if (!templateId || !segmentId) return;
    setPending(true);
    setError(null);
    try {
      const data = await apiPost<{
        success: true;
        preview: TemplatePreviewView;
      }>(`/api/admin/marketing/templates/${templateId}/preview`, {
        segmentId,
        email: email.trim() || undefined,
        locale,
      });
      setPreview(data.preview);
    } catch {
      setPreview(null);
      setError(t("preview-failed"));
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="desk-card flex flex-col gap-4 rounded-md border border-border bg-card p-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          {t("preview-title")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("preview-desc")}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="preview-template">{t("template")}</Label>
          <Select value={templateId} onValueChange={setTemplateId}>
            <SelectTrigger id="preview-template" className="h-11 w-full">
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
          <Label htmlFor="preview-segment">{t("segment")}</Label>
          <Select value={segmentId} onValueChange={setSegmentId}>
            <SelectTrigger id="preview-segment" className="h-11 w-full">
              <SelectValue placeholder={t("choose-segment")} />
            </SelectTrigger>
            <SelectContent>
              {segments.map((segment) => (
                <SelectItem key={segment.id} value={segment.id}>
                  {segment.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="preview-email">{t("customer-email")}</Label>
          <Input
            id="preview-email"
            name="preview-email"
            type="email"
            autoComplete="off"
            value={email}
            placeholder={t("customer-email-placeholder")}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="preview-locale">{t("locale")}</Label>
          <Select value={locale} onValueChange={setLocale}>
            <SelectTrigger id="preview-locale" className="h-11 w-full">
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
          disabled={pending || !templateId || !segmentId}
          onClick={() => void loadPreview()}
        >
          {pending ? t("previewing") : t("preview")}
        </Button>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </div>

      {preview ? <MarketingPreviewResult preview={preview} /> : null}
    </section>
  );
}
