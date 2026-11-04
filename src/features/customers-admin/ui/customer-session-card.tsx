"use client";

import type { ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { formatProfileDateTime } from "@/features/customers-admin/ui/customer-profile-format";
import type { CustomerSessionRow } from "@/features/customers-admin/lib/customer-profile/customer-profile.types";

const DEVICE_KEYS = {
  mobile: "device-mobile",
  desktop: "device-desktop",
  unknown: "device-unknown",
} as const;

const STATUS_KEYS = {
  active: "session-active",
  revoked: "session-revoked",
  expired: "session-expired",
} as const;

export function CustomerSessionCard({
  session,
  onRevoke,
}: {
  session: CustomerSessionRow;
  onRevoke: () => void;
}) {
  const t = useTranslations("Dashboard.CustomerProfile");
  const locale = useLocale();
  const device = t(DEVICE_KEYS[session.deviceFamily]);

  return (
    <li className="flex flex-col gap-3 rounded border border-border/60 bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium">{device}</p>
          {session.ipPrefix ? (
            <p className="text-xs text-muted-foreground tabular-nums">
              {t("column-ip")}: {session.ipPrefix}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={session.status === "active" ? "secondary" : "outline"}
            className="rounded-chip"
          >
            {t(STATUS_KEYS[session.status])}
          </Badge>
          {session.status === "active" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-11"
              onClick={onRevoke}
            >
              {t("revoke")}
              <span className="sr-only"> — {device}</span>
            </Button>
          ) : null}
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
        <Field label={t("column-created")}>
          {formatProfileDateTime(session.createdAt, locale) ?? "—"}
        </Field>
        <Field label={t("column-last-seen")}>
          {formatProfileDateTime(session.lastSeenAt, locale) ?? "—"}
        </Field>
        <Field label={t("column-expires")}>
          {formatProfileDateTime(session.expiresAt, locale) ?? "—"}
        </Field>
      </dl>
    </li>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate tabular-nums">{children}</dd>
    </div>
  );
}
