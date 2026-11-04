"use client";

import { useTranslations } from "next-intl";

import type { TemplatePreviewView } from "@/features/marketing/ui/marketing-ui.types";

export function MarketingPreviewResult({
  preview,
}: {
  preview: TemplatePreviewView;
}) {
  const t = useTranslations("MarketingDesk");

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        {t("preview-for", {
          name: preview.customer.name || preview.customer.email,
          email: preview.customer.email,
        })}
      </p>
      {preview.fallbackUsed ? (
        <p className="text-sm text-muted-foreground">
          {t("fallback-note", { locale: preview.locale })}
        </p>
      ) : null}

      {preview.template.channel === "email" ? (
        <>
          <p className="text-sm">
            <span className="font-medium">{t("subject")}: </span>
            {preview.subject}
          </p>
          {preview.preheader ? (
            <p className="text-sm text-muted-foreground">
              {preview.preheader}
            </p>
          ) : null}
          <iframe
            title={t("preview-frame")}
            sandbox=""
            srcDoc={preview.body}
            className="h-64 w-full rounded border border-border bg-background"
          />
        </>
      ) : (
        <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded border border-border bg-muted/40 p-3 text-sm">
          {preview.text}
        </pre>
      )}

      {preview.missingVariables.length > 0 ? (
        <p role="status" className="text-sm text-destructive">
          {t("missing-variables", {
            list: preview.missingVariables.join(", "),
          })}
        </p>
      ) : null}
    </div>
  );
}
