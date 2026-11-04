"use client";

import { useTranslations } from "next-intl";

import { DeskPageMeta } from "@/features/dashboard/ui/desk-page-chrome";
import { useMarketingDesk } from "@/features/marketing/hooks/use-marketing-desk";
import { MarketingSegmentsCard } from "@/features/marketing/ui/marketing-segments-card";
import { MarketingTemplatesCard } from "@/features/marketing/ui/marketing-templates-card";
import { MarketingPreviewCard } from "@/features/marketing/ui/marketing-preview-card";
import { MarketingTestSendForm } from "@/features/marketing/ui/marketing-test-send-form";

export function MarketingPage() {
  const t = useTranslations("MarketingDesk");
  const desk = useMarketingDesk();

  return (
    <div className="flex flex-col gap-5">
      <DeskPageMeta title={t("title")} description={t("description")} />

      {desk.error ? (
        <div className="flex flex-col items-start gap-3">
          <p role="alert" className="text-sm text-destructive">
            {t("load-failed")}
          </p>
          <button
            type="button"
            className="min-h-11 underline underline-offset-4"
            onClick={() => void desk.reload()}
          >
            {t("retry")}
          </button>
        </div>
      ) : desk.isLoading ? (
        <p className="text-sm text-muted-foreground">{t("loading")}</p>
      ) : (
        <>
          <MarketingSegmentsCard
            segments={desk.segments}
            onCreate={async (name, filter) => {
              await desk.createSegment(name, filter);
            }}
            onDelete={desk.deleteSegment}
          />
          <MarketingTemplatesCard
            templates={desk.templates}
            onSave={async (input, id) => {
              await desk.saveTemplate(input, id);
            }}
            onDelete={desk.deleteTemplate}
          />
          <MarketingPreviewCard
            segments={desk.segments}
            templates={desk.templates}
          />
          <MarketingTestSendForm templates={desk.templates} />
        </>
      )}
    </div>
  );
}
