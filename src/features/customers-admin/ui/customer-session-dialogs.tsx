"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";

export type RevokeDialogState =
  | { kind: "one"; sessionId: string }
  | { kind: "all" }
  | null;

export function CustomerSessionDialogs({
  dialog,
  pending,
  error,
  onClose,
  onConfirm,
}: {
  dialog: RevokeDialogState;
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const t = useTranslations("Dashboard.CustomerProfile");
  const one = dialog?.kind === "one";

  return (
    <Dialog
      open={dialog !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{one ? t("revoke-one-title") : t("revoke-all-title")}</DialogTitle>
          <DialogDescription>
            {one ? t("revoke-one-description") : t("revoke-all-description")}
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button type="button" variant="outline" className="min-h-11" disabled={pending}>
              {t("cancel")}
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            className="min-h-11"
            disabled={pending}
            onClick={onConfirm}
          >
            {pending
              ? t("revoking")
              : one
                ? t("confirm-revoke")
                : t("confirm-revoke-all")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
