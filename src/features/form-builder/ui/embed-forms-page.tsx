"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";
import { apiGet } from "@/shared/http/api";
import type { IFormLayout } from "@/features/form-builder/model";
import { createEmbedScript } from "@/features/form-builder/lib/create-embed-script";
import { EmbedFormPreview } from "@/features/form-builder/ui/embed-form-preview";
import { EmbedVariantList } from "@/features/form-builder/ui/embed-variant-list";
import {
  customEmbedVariants,
  defaultEmbedVariants,
} from "@/features/form-builder/ui/embed-default-variants";
import { DeskPageMeta } from "@/features/dashboard/ui/desk-page-chrome";

export function EmbedFormsPage() {
  const t = useTranslations("WidgetConfigurator");
  const allT = useTranslations();
  const [copied, setCopied] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState("v1");
  const [showCode, setShowCode] = useState(true);
  const [customLayouts, setCustomLayouts] = useState<IFormLayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canRetryLoad, setCanRetryLoad] = useState(false);

  const load = useCallback(async () => {
      setLoading(true);
      setError(null);
      setCanRetryLoad(false);
      try {
        const response = await apiGet<{ success: boolean; data: IFormLayout[] }>(
          "/api/form-layouts"
        );
        if (response.success && response.data) {
          setCustomLayouts(response.data.filter((layout) => layout.isActive));
        }
      } catch {
        setError(t("load_error"));
        setCanRetryLoad(true);
      } finally {
        setLoading(false);
      }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const defaults = defaultEmbedVariants(t);
  const custom = customEmbedVariants(customLayouts, t);
  const all = [...defaults, ...custom];
  const selected = all.find((item) => item.id === selectedVariant) ?? all[0];
  const snippet = selected ? createEmbedScript(baseUrl, selected.path) : "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setError(null);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(t("copy_error"));
      setCanRetryLoad(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-8 lg:grid-cols-12" role="status">
        <span className="sr-only">{t("loading")}</span>
        <div className="space-y-3 lg:col-span-4">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-16 animate-pulse rounded-md border border-border bg-card" />
          ))}
        </div>
        <div className="h-96 animate-pulse rounded-xl border border-border bg-card lg:col-span-8" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <DeskPageMeta title={t("install_title")} description={t("install_help")} />
      {error ? (
        <p className="rounded-md border border-destructive/40 bg-card px-4 py-3 text-sm text-destructive" role="alert">
          {error}
          {canRetryLoad ? <button
            type="button"
            className="ms-3 min-h-11 rounded-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            onClick={() => void load()}
          >
            {allT("Dashboard.Home.try-again")}
          </button> : null}
        </p>
      ) : null}
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-4">
          <EmbedVariantList
            title={t("default_variants")}
            variants={defaults}
            selectedId={selectedVariant}
            onSelect={setSelectedVariant}
          />
          {custom.length > 0 ? (
            <EmbedVariantList
              title={t("custom_layouts")}
              variants={custom}
              selectedId={selectedVariant}
              onSelect={setSelectedVariant}
              badgeFor={(variant) =>
                customLayouts.find((layout) => layout._id === variant.layoutId)?.isDefault
                  ? t("default")
                  : null
              }
            />
          ) : null}
          <Button
            variant="outline"
            className="h-11 w-full"
            onClick={() => setShowCode((open) => !open)}
          >
            {showCode ? t("hide") : t("show")} {t("snippet_label")}
          </Button>
        </div>
        <div className="min-w-0 lg:col-span-8">
          {selected ? (
            <EmbedFormPreview
              previewLabel={t("preview_named", { name: selected.name })}
              path={selected.path}
              showCode={showCode}
              snippet={snippet}
              copied={copied}
              onCopy={copy}
              copyLabel={t("copy")}
              copiedLabel={t("copied")}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
