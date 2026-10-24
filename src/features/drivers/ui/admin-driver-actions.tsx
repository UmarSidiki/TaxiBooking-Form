"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import type { DriverStatus } from "@/features/drivers/model";
import { DeskConfirmDialog } from "@/features/dashboard/ui/desk-confirm-dialog";
import { Button } from "@/shared/ui/button";

export function AdminDriverActions({
  status,
  isActive,
  pending,
  onApprove,
  onReject,
  onSetActive,
}: {
  status: DriverStatus;
  isActive: boolean;
  pending?: boolean;
  onApprove: () => void;
  onReject: () => void;
  onSetActive: (active: boolean) => void;
}) {
  const t = useTranslations("Driver");
  const [confirm, setConfirm] = useState<"reject" | "turn-off" | null>(null);

  return (
    <div className="mt-3 flex flex-col gap-2">
      {status === "pending" ? (
        <>
          <Button type="button" className="h-11" disabled={pending} onClick={onApprove}>
            {t("approve")}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11"
            disabled={pending}
            onClick={() => setConfirm("reject")}
          >
            {t("reject")}
          </Button>
        </>
      ) : null}
      {status === "approved" ? (
        <Button
          type="button"
          variant={isActive ? "outline" : "default"}
          className="h-11"
          disabled={pending}
          onClick={() => (isActive ? setConfirm("turn-off") : onSetActive(true))}
        >
          {isActive ? t("turn-off") : t("turn-on")}
        </Button>
      ) : null}
      <DeskConfirmDialog
        open={confirm !== null}
        title={confirm === "reject" ? t("reject-title") : t("turn-off-title")}
        description={confirm === "reject" ? t("reject-body") : t("turn-off-body")}
        confirmLabel={confirm === "reject" ? t("reject") : t("turn-off")}
        cancelLabel={t("cancel")}
        pending={pending}
        onConfirm={() => {
          const action = confirm;
          setConfirm(null);
          if (action === "reject") onReject();
          if (action === "turn-off") onSetActive(false);
        }}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
      />
    </div>
  );
}
