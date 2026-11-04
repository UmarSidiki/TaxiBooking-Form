"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { DeskConfirmDialog } from "@/features/dashboard/ui/desk-confirm-dialog";
import { MarketingTemplateEditor } from "@/features/marketing/ui/marketing-template-editor";
import type { MarketingTemplate } from "@/features/marketing/ui/marketing-ui.types";
import type { CampaignTemplateWriteInput } from "@/features/marketing/schema/campaign-template.schema";

export function MarketingTemplatesCard({
  templates,
  onSave,
  onDelete,
}: {
  templates: MarketingTemplate[];
  onSave: (input: CampaignTemplateWriteInput, id?: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const t = useTranslations("MarketingDesk");
  const [editorOpen, setEditorOpen] = useState(false);
  const [selected, setSelected] = useState<MarketingTemplate | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function openEditor(template: MarketingTemplate | null) {
    setSelected(template);
    setEditorOpen(true);
  }

  return (
    <section className="desk-card flex flex-col gap-4 rounded-md border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            {t("templates-title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("templates-desc")}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          onClick={() => openEditor(null)}
        >
          {t("new-template")}
        </Button>
      </div>

      {templates.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("templates-empty")}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border/60">
          {templates.map((template) => (
            <li
              key={template.id}
              className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-2">
                <Badge variant="outline" className="rounded-chip">
                  {template.channel === "email"
                    ? t("channel-email")
                    : t("channel-whatsapp")}
                </Badge>
                <p className="truncate font-medium">{template.name}</p>
                <span className="text-sm text-muted-foreground">
                  {t("version", { version: template.version })}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-11"
                  aria-label={t("edit")}
                  title={t("edit")}
                  onClick={() => openEditor(template)}
                >
                  <Pencil className="size-4" aria-hidden="true" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-11"
                  aria-label={t("delete")}
                  title={t("delete")}
                  onClick={() => setDeleteId(template.id)}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editorOpen ? (
        <div className="border-t border-border/60 pt-4">
          <MarketingTemplateEditor
            key={selected?.id ?? `new-${templates.length}`}
            template={selected}
            onCancel={() => setEditorOpen(false)}
            onSave={async (input) => {
              await onSave(input, selected?.id);
              setEditorOpen(false);
            }}
          />
        </div>
      ) : null}

      <DeskConfirmDialog
        open={deleteId !== null}
        title={t("delete-template-title")}
        description={t("delete-template-desc")}
        confirmLabel={t("confirm-delete")}
        cancelLabel={t("cancel")}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
        onConfirm={() => {
          if (deleteId) void onDelete(deleteId).then(() => setDeleteId(null));
        }}
      />
    </section>
  );
}
