"use client";

import { Blocks, Layers, Smartphone, Star, Zap } from "lucide-react";
import type { useTranslations } from "next-intl";

import type { EmbedVariant } from "@/features/form-builder/ui/embed-variant-list";
import type { IFormLayout } from "@/features/form-builder/model";

type TFn = ReturnType<typeof useTranslations<"WidgetConfigurator">>;

export function defaultEmbedVariants(t: TFn): EmbedVariant[] {
  return [
    {
      id: "v1",
      name: t("variants.v1_name"),
      description: t("variants.v1_desc"),
      features: [
        t("variants.v1_feature1"),
        t("variants.v1_feature2"),
        t("variants.v1_feature3"),
        t("variants.v1_feature4"),
      ],
      path: "/embeddable/v1",
      icon: <Layers className="size-4" />,
    },
    {
      id: "v2",
      name: t("variants.v2_name"),
      description: t("variants.v2_desc"),
      features: [
        t("variants.v2_feature1"),
        t("variants.v2_feature2"),
        t("variants.v2_feature3"),
        t("variants.v2_feature4"),
      ],
      path: "/embeddable/v2",
      icon: <Zap className="size-4" />,
    },
    {
      id: "v3",
      name: t("variants.v3_name"),
      description: t("variants.v3_desc"),
      features: [
        t("variants.v3_feature1"),
        t("variants.v3_feature2"),
        t("variants.v3_feature3"),
        t("variants.v3_feature4"),
      ],
      path: "/embeddable/v3",
      icon: <Smartphone className="size-4" />,
    },
  ];
}

export function customEmbedVariants(
  layouts: IFormLayout[],
  t: TFn
): EmbedVariant[] {
  return layouts.map((layout) => ({
    id: `custom-${layout._id}`,
    name: layout.name,
    description: layout.description || t("custom_variants.custom_form_layout"),
    features: [
      t("custom_variants.fields_enabled", {
        0: layout.fields.filter((field) => field.enabled).length,
      }),
      layout.isDefault
        ? t("custom_variants.default_layout")
        : t("custom_variants.custom_layout"),
    ],
    path: `/embeddable/custom/${layout._id}`,
    icon: layout.isDefault ? <Star className="size-4" /> : <Blocks className="size-4" />,
    isCustom: true,
    layoutId: layout._id,
  }));
}
