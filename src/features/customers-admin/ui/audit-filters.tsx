"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { ADMIN_AUDIT_ACTIONS } from "@/features/customers-admin/lib/audit/audit-actions";
import { auditActionKey } from "@/features/customers-admin/ui/audit-format";
import { AuditFilterField } from "@/features/customers-admin/ui/audit-filter-field";
import type { AdminAuditQuery } from "@/features/customers-admin/schema/admin-audit.schema";

type Draft = {
  action: AdminAuditQuery["action"];
  target: string;
  actor: string;
  from: string;
  to: string;
};

function draftFrom(params: AdminAuditQuery): Draft {
  return {
    action: params.action,
    target: params.target,
    actor: params.actor,
    from: params.from ?? "",
    to: params.to ?? "",
  };
}

export function AuditFilters({
  params,
  onApply,
  onReset,
}: {
  params: AdminAuditQuery;
  onApply: (patch: Partial<AdminAuditQuery>) => void;
  onReset: () => void;
}) {
  const t = useTranslations("Dashboard.AdminAudit");
  const [draft, setDraft] = useState<Draft>(() => draftFrom(params));

  useEffect(() => {
    setDraft(draftFrom(params));
  }, [params]);

  return (
    <form
      className="desk-card grid gap-3 rounded border border-border/60 bg-card p-4 sm:grid-cols-2 xl:grid-cols-6"
      onSubmit={(event) => {
        event.preventDefault();
        onApply({
          action: draft.action,
          target: draft.target.trim(),
          actor: draft.actor.trim(),
          from: draft.from || undefined,
          to: draft.to || undefined,
        });
      }}
    >
      <AuditFilterField label={t("filter-action")}>
        <Select
          value={draft.action}
          onValueChange={(value) =>
            setDraft((current) => ({
              ...current,
              action: value as Draft["action"],
            }))
          }
        >
          <SelectTrigger className="h-11 w-full" aria-label={t("filter-action")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">{t("action-any")}</SelectItem>
            {ADMIN_AUDIT_ACTIONS.map((action) => (
              <SelectItem key={action} value={action}>
                {t(auditActionKey(action))}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </AuditFilterField>

      <AuditFilterField label={t("filter-actor")}>
        <Input
          value={draft.actor}
          autoComplete="off"
          placeholder={t("filter-actor-placeholder")}
          onChange={(event) =>
            setDraft((current) => ({ ...current, actor: event.target.value }))
          }
        />
      </AuditFilterField>

      <AuditFilterField label={t("filter-target")}>
        <Input
          value={draft.target}
          autoComplete="off"
          placeholder={t("filter-target-placeholder")}
          onChange={(event) =>
            setDraft((current) => ({ ...current, target: event.target.value }))
          }
        />
      </AuditFilterField>

      <AuditFilterField label={t("filter-from")}>
        <Input
          type="date"
          value={draft.from}
          onChange={(event) =>
            setDraft((current) => ({ ...current, from: event.target.value }))
          }
        />
      </AuditFilterField>

      <AuditFilterField label={t("filter-to")}>
        <Input
          type="date"
          value={draft.to}
          onChange={(event) =>
            setDraft((current) => ({ ...current, to: event.target.value }))
          }
        />
      </AuditFilterField>

      <div className="flex items-end gap-2">
        <Button type="submit" className="h-11 flex-1">
          {t("apply")}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11 flex-1"
          onClick={() => {
            setDraft(draftFrom(params));
            onReset();
          }}
        >
          {t("reset")}
        </Button>
      </div>
    </form>
  );
}
