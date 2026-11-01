"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/features/customers-admin/ui/customer-bookings-tab";
import { CustomerSessionCard } from "@/features/customers-admin/ui/customer-session-card";
import {
  CustomerSessionDialogs,
  type RevokeDialogState,
} from "@/features/customers-admin/ui/customer-session-dialogs";
import type { CustomerSessionRow } from "@/features/customers-admin/lib/customer-profile/customer-profile.types";

export function CustomerSessionsTab({
  sessions,
  onRevoke,
  onRevokeAll,
}: {
  sessions: CustomerSessionRow[];
  onRevoke: (sessionId: string) => Promise<void>;
  onRevokeAll: () => Promise<void>;
}) {
  const t = useTranslations("Dashboard.CustomerProfile");
  const [dialog, setDialog] = useState<RevokeDialogState>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasActive = sessions.some((session) => session.status === "active");

  const close = () => {
    if (pending) return;
    setDialog(null);
    setError(null);
  };

  const confirm = async () => {
    if (!dialog) return;
    setPending(true);
    setError(null);
    try {
      if (dialog.kind === "one") {
        await onRevoke(dialog.sessionId);
      } else {
        await onRevokeAll();
      }
      setDialog(null);
    } catch {
      setError(t("revoke-failed"));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {t("sessions-count", { count: sessions.length })}
        </p>
        <Button
          type="button"
          variant="outline"
          className="min-h-11"
          disabled={!hasActive}
          onClick={() => setDialog({ kind: "all" })}
        >
          <LogOut className="size-4 rtl:rotate-180" aria-hidden="true" />
          {t("revoke-all")}
        </Button>
      </div>

      {sessions.length === 0 ? (
        <EmptyState message={t("sessions-empty")} />
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {sessions.map((session) => (
            <CustomerSessionCard
              key={session.id}
              session={session}
              onRevoke={() => setDialog({ kind: "one", sessionId: session.id })}
            />
          ))}
        </ul>
      )}

      <CustomerSessionDialogs
        dialog={dialog}
        pending={pending}
        error={error}
        onClose={close}
        onConfirm={() => void confirm()}
      />
    </div>
  );
}
