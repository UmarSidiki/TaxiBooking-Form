"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { apiGet } from "@/shared/http/api";
import type { IFormLayout } from "@/features/form-builder/model";
import { createEmbedScript } from "@/features/form-builder/lib/create-embed-script";
import {
  EmbedFormPreview,
} from "@/features/form-builder/ui/embed-form-preview";
import { EmbedVariantList } from "@/features/form-builder/ui/embed-variant-list";
import {
  customEmbedVariants,
  defaultEmbedVariants,
} from "@/features/form-builder/ui/embed-default-variants";

export function EmbedFormsPage() {
  const t = useTranslations("WidgetConfigurator");
  const [copied, setCopied] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState("v1");
  const [showCode, setShowCode] = useState(false);
  const [customLayouts, setCustomLayouts] = useState<IFormLayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await apiGet<{ success: boolean; data: IFormLayout[] }>(
          "/api/form-layouts"
        );
        if (response.success && response.data) {
          setCustomLayouts(response.data.filter((layout) => layout.isActive));
        }
      } catch {
        setError(t("custom_variants.custom_form_layout"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [t]);

  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

  const defaults = defaultEmbedVariants(t);
  const custom = customEmbedVariants(customLayouts, t);

  const all = [...defaults, ...custom];
  const selected = all.find((item) => item.id === selectedVariant) ?? all[0];

  const copy = async () => {
    await navigator.clipboard.writeText(
      createEmbedScript(baseUrl, selected.path)
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <Badge variant="outline">{t("stable_badge")}</Badge>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
          {t("title")} {t("configurator")}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          {t("description")}
        </p>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-4">
          <EmbedVariantList
            title={t("default_variants")}
            variants={defaults}
            selectedId={selectedVariant}
            onSelect={setSelectedVariant}
          />
          {loading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              {t("custom_layouts")}…
            </p>
          ) : custom.length > 0 ? (
            <EmbedVariantList
              title={t("custom_layouts")}
              variants={custom}
              selectedId={selectedVariant}
              onSelect={setSelectedVariant}
              badgeFor={(variant) =>
                customLayouts.find((layout) => layout._id === variant.layoutId)
                  ?.isDefault
                  ? t("default")
                  : null
              }
            />
          ) : null}
          <Card className="desk-card border-border">
            <CardHeader>
              <CardTitle className="text-sm">{t("key_features")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              {selected.features.map((feature) => (
                <p key={feature}>{feature}</p>
              ))}
            </CardContent>
          </Card>
          <Button
            variant="outline"
            className="h-11 w-full"
            onClick={() => setShowCode((open) => !open)}
          >
            {showCode ? t("hide") : t("show")} {t("dev_settings")}
          </Button>
        </div>
        <div className="lg:col-span-8">
          <EmbedFormPreview
            previewLabel={`${t("preview")} ${selected.id.toUpperCase()}`}
            path={selected.path}
            showCode={showCode}
            snippet={createEmbedScript(baseUrl, selected.path)}
            copied={copied}
            onCopy={copy}
            copyLabel={t("copy")}
            copiedLabel={t("copied")}
          />
        </div>
      </div>
    </div>
  );
}
