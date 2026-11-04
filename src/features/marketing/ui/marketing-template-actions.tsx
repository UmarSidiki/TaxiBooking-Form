"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";

export function MarketingTemplateActions({
  pending,
  failed,
  canSave,
  onSave,
  onCancel,
}: {
  pending: boolean;
  failed: boolean;
  canSave: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations("MarketingDesk");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        className="min-h-11"
        disabled={pending || !canSave}
        onClick={onSave}
      >
        {pending ? t("saving") : t("save")}
      </Button>
      <Button type="button" variant="outline" className="min-h-11" onClick={onCancel}>
        {t("cancel")}
      </Button>
      {failed ? (
        <p role="alert" className="text-sm text-destructive">
          {t("save-failed")}
        </p>
      ) : null}
    </div>
  );
}
