"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { DeskConfirmDialog } from "@/features/dashboard/ui/desk-confirm-dialog";
import { CustomerFilterFields } from "@/features/customers-admin/ui/customers-filter-fields";
import {
  DEFAULT_CUSTOMER_LIST_PARAMS,
  type CustomerListParams,
} from "@/features/customers-admin/schema/customer-list.schema";
import { useSegmentCounts } from "@/features/marketing/hooks/use-segment-counts";
import type { MarketingSegment } from "@/features/marketing/ui/marketing-ui.types";

export function MarketingSegmentsCard({
  segments,
  onCreate,
  onDelete,
}: {
  segments: MarketingSegment[];
  onCreate: (name: string, filter: CustomerListParams) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const t = useTranslations("MarketingDesk");
  const counts = useSegmentCounts(segments);
  const [name, setName] = useState("");
  const [filter, setFilter] = useState<CustomerListParams>(
    DEFAULT_CUSTOMER_LIST_PARAMS,
  );
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function submit() {
    if (!name.trim()) return;
    setPending(true);
    setFailed(false);
    try {
      await onCreate(name.trim(), filter);
      setName("");
      setFilter(DEFAULT_CUSTOMER_LIST_PARAMS);
    } catch {
      setFailed(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="desk-card flex flex-col gap-4 rounded-md border border-border bg-card p-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          {t("segments-title")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("segments-desc")}</p>
      </div>

      <div className="rounded border border-border/60 p-4">
        <div className="mb-3">
          <Label htmlFor="segment-name">{t("name")}</Label>
          <Input
            id="segment-name"
            name="segment-name"
            value={name}
            maxLength={120}
            placeholder={t("name-placeholder")}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <CustomerFilterFields
          draft={filter}
          onChange={(patch) => setFilter((prev) => ({ ...prev, ...patch }))}
        />
        <div className="mt-4 flex items-center gap-3">
          <Button
            type="button"
            className="min-h-11"
            disabled={pending || !name.trim()}
            onClick={() => void submit()}
          >
            {pending ? t("creating") : t("create")}
          </Button>
          {failed ? (
            <p role="alert" className="text-sm text-destructive">
              {t("create-failed")}
            </p>
          ) : null}
        </div>
      </div>

      {segments.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border/60">
          {segments.map((segment) => (
            <li
              key={segment.id}
              className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{segment.name}</p>
                <p className="text-sm text-muted-foreground">
                  {t("counts", {
                    email: counts[segment.id]?.email?.eligible ?? 0,
                    whatsapp: counts[segment.id]?.whatsapp?.eligible ?? 0,
                  })}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-11"
                aria-label={t("delete")}
                title={t("delete")}
                onClick={() => setDeleteId(segment.id)}
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <DeskConfirmDialog
        open={deleteId !== null}
        title={t("delete-title")}
        description={t("delete-desc")}
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
