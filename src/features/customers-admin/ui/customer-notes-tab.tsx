"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";
import { DeskConfirmDialog } from "@/features/dashboard/ui/desk-confirm-dialog";
import { CustomerNoteCard } from "@/features/customers-admin/ui/customer-note-card";
import { CustomerNoteEditor } from "@/features/customers-admin/ui/customer-note-editor";
import { useCustomerNotes } from "@/features/customers-admin/hooks/use-customer-notes";
import type { AdminNoteRow } from "@/features/customers-admin/lib/notes/admin-note.types";

export function CustomerNotesTab({ email }: { email: string }) {
  const t = useTranslations("Dashboard.CustomerNotes");
  const locale = useLocale();
  const notes = useCustomerNotes(email);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminNoteRow | null>(null);
  const [pending, setPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [formVersion, setFormVersion] = useState(0);

  const create = async (text: string) => {
    setPending(true);
    setActionError(null);
    try {
      await notes.create(text);
      setFormVersion((value) => value + 1);
    } catch {
      setActionError(t("create-failed"));
    } finally {
      setPending(false);
    }
  };

  const update = async (noteId: string, text: string) => {
    setPending(true);
    setActionError(null);
    try {
      await notes.update(noteId, text);
      setEditingId(null);
    } catch {
      setActionError(t("update-failed"));
    } finally {
      setPending(false);
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    setPending(true);
    setActionError(null);
    try {
      await notes.remove(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      setActionError(t("delete-failed"));
    } finally {
      setPending(false);
    }
  };

  if (notes.state === "loading") {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        {t("loading")}
      </p>
    );
  }

  if (notes.state !== "ready") {
    return (
      <div className="flex flex-col items-start gap-3 rounded border border-border/60 bg-card p-5">
        <p role="alert" className="font-medium">
          {notes.state === "forbidden" ? t("forbidden") : t("error")}
        </p>
        <Button type="button" variant="outline" className="min-h-11" onClick={notes.reload}>
          {t("retry")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded border border-border/60 bg-card p-4">
        <CustomerNoteEditor
          key={formVersion}
          label={t("new-label")}
          placeholder={t("placeholder")}
          submitLabel={t("add")}
          pending={pending}
          onSubmit={create}
        />
      </div>

      {actionError ? (
        <p role="alert" className="text-sm text-destructive">
          {actionError}
        </p>
      ) : null}

      {notes.notes.length === 0 ? (
        <p className="rounded border border-dashed border-border/70 p-5 text-sm text-muted-foreground">
          {t("empty")}
        </p>
      ) : (
        <ul className="grid gap-3">
          {notes.notes.map((note) => (
            <CustomerNoteCard
              key={note.id}
              note={note}
              locale={locale}
              editing={editingId === note.id}
              pending={pending}
              onEdit={() => {
                setActionError(null);
                setEditingId(note.id);
              }}
              onDelete={() => {
                setActionError(null);
                setDeleteTarget(note);
              }}
              onSave={(text) => update(note.id, text)}
              onCancel={() => setEditingId(null)}
            />
          ))}
        </ul>
      )}

      <DeskConfirmDialog
        open={deleteTarget !== null}
        title={t("delete-title")}
        description={t("delete-description")}
        confirmLabel={pending ? t("deleting") : t("confirm-delete")}
        cancelLabel={t("cancel")}
        pending={pending}
        onConfirm={() => void remove()}
        onOpenChange={(open) => {
          if (!open && !pending) setDeleteTarget(null);
        }}
      />
    </div>
  );
}
