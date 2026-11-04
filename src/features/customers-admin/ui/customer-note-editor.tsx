"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";
import { ADMIN_NOTE_MAX_LENGTH } from "@/features/customers-admin/lib/notes/admin-note.constants";

export function CustomerNoteEditor({
  initialText = "",
  label,
  placeholder,
  submitLabel,
  pending,
  onSubmit,
  onCancel,
}: {
  initialText?: string;
  label: string;
  placeholder?: string;
  submitLabel: string;
  pending: boolean;
  onSubmit: (text: string) => void | Promise<void>;
  onCancel?: () => void;
}) {
  const t = useTranslations("Dashboard.CustomerNotes");
  const id = useId();
  const [text, setText] = useState(initialText);
  const trimmed = text.trim();
  const disabled = pending || trimmed.length === 0;

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (disabled) return;
        void onSubmit(trimmed);
      }}
    >
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <Textarea
        id={id}
        value={text}
        rows={4}
        maxLength={ADMIN_NOTE_MAX_LENGTH}
        placeholder={placeholder}
        onChange={(event) => setText(event.target.value)}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs tabular-nums text-muted-foreground" aria-live="polite">
          {t("char-count", { count: text.length, max: ADMIN_NOTE_MAX_LENGTH })}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {onCancel ? (
            <Button
              type="button"
              variant="ghost"
              className="min-h-11"
              disabled={pending}
              onClick={onCancel}
            >
              {t("cancel")}
            </Button>
          ) : null}
          <Button type="submit" className="min-h-11" disabled={disabled}>
            {pending ? t("saving") : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
