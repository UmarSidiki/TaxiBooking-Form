"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { AdminNoteText } from "@/features/customers-admin/ui/admin-note-text";
import { CustomerNoteEditor } from "@/features/customers-admin/ui/customer-note-editor";
import { formatProfileDateTime } from "@/features/customers-admin/ui/customer-profile-format";
import type { AdminNoteRow } from "@/features/customers-admin/lib/notes/admin-note.types";

export function CustomerNoteCard({
  note,
  locale,
  editing,
  pending,
  onEdit,
  onDelete,
  onSave,
  onCancel,
}: {
  note: AdminNoteRow;
  locale: string;
  editing: boolean;
  pending: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onSave: (text: string) => void | Promise<void>;
  onCancel: () => void;
}) {
  const t = useTranslations("Dashboard.CustomerNotes");
  const author = note.authorName || note.authorId || "—";
  const createdAt = formatProfileDateTime(note.createdAt, locale);
  const edited = note.updatedAt !== note.createdAt;

  return (
    <li className="flex flex-col gap-3 rounded border border-border/60 bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{author}</p>
          <p className="text-xs tabular-nums text-muted-foreground">
            {createdAt ?? "—"}
            {edited ? ` · ${t("edited")}` : null}
          </p>
        </div>
        {note.canEdit && !editing ? (
          <div className="flex flex-wrap items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="min-h-11"
              onClick={onEdit}
            >
              <Pencil className="size-4" aria-hidden="true" />
              {t("edit")}
              <span className="sr-only"> — {author}</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="min-h-11 text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="size-4" aria-hidden="true" />
              {t("delete")}
              <span className="sr-only"> — {author}</span>
            </Button>
          </div>
        ) : null}
      </div>

      {editing ? (
        <CustomerNoteEditor
          initialText={note.text}
          label={t("edit-label")}
          submitLabel={t("save")}
          pending={pending}
          onSubmit={onSave}
          onCancel={onCancel}
        />
      ) : (
        <AdminNoteText text={note.text} />
      )}

      {note.canEdit && !editing ? (
        <Badge variant="outline" className="w-fit rounded-chip text-muted-foreground">
          {t("yours")}
        </Badge>
      ) : null}
    </li>
  );
}
