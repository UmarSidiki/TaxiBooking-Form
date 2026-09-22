"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import type { WhatsAppLinkView } from "@/features/settings/ui/whatsapp-desk-types";
import { apiDelete, apiGet, apiPost } from "@/shared/http/api";
import { Button } from "@/shared/ui/button";

const POLL_MS = 2000;

export function WhatsAppLinkPanel() {
  const t = useTranslations("Dashboard.Settings");
  const [link, setLink] = useState<WhatsAppLinkView | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    let stop = false;
    const pull = async () => {
      const id = ++requestId.current;
      try {
        const data = await apiGet<{ success: boolean; data: WhatsAppLinkView }>(
          "/api/settings/whatsapp/session"
        );
        if (stop || id !== requestId.current || !data.success) return;
        setLink(data.data);
        setError(false);
      } catch {
        if (!stop && id === requestId.current) setError(true);
      }
    };
    void pull();
    const timer = window.setInterval(() => {
      if (link?.status === "waiting") void pull();
    }, POLL_MS);
    return () => {
      stop = true;
      window.clearInterval(timer);
    };
  }, [link?.status]);

  const start = async () => {
    const id = ++requestId.current;
    setBusy(true);
    setError(false);
    try {
      const data = await apiPost<{ success: boolean; data: WhatsAppLinkView }>(
        "/api/settings/whatsapp/session",
        {}
      );
      if (id === requestId.current && data.success) setLink(data.data);
    } catch {
      if (id === requestId.current) setError(true);
    } finally {
      setBusy(false);
    }
  };

  const unlink = async () => {
    if (!window.confirm(t("whatsapp_unlink_confirm"))) return;
    setBusy(true);
    try {
      const data = await apiDelete<{ success: boolean; data: WhatsAppLinkView }>(
        "/api/settings/whatsapp/session"
      );
      if (data.success) setLink(data.data);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  const status = link?.status ?? "needs_scan";
  const waiting = status === "waiting" && !error;
  const statusLabel = {
    needs_scan: t("whatsapp_needs_scan"),
    waiting: t("whatsapp_linking"),
    linked: t("whatsapp_linked"),
    failed: t("whatsapp_link_failed"),
  }[status];

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-medium" role="status" aria-live="polite">
        {statusLabel}
      </p>
      {link?.qrDataUrl ? (
        <img
          src={link.qrDataUrl}
          alt={t("whatsapp_qr_label")}
          width={240}
          height={240}
          className="size-60 rounded-md border border-border bg-card"
        />
      ) : null}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {t("whatsapp_link_failed")}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {status === "linked" ? (
          <Button type="button" variant="outline" className="h-11" onClick={unlink} disabled={busy}>
            {busy ? t("whatsapp_linking") : t("whatsapp_unlink")}
          </Button>
        ) : (
          <Button type="button" className="h-11" onClick={start} disabled={busy || waiting}>
            {busy || waiting ? t("whatsapp_linking") : t("whatsapp_link")}
          </Button>
        )}
      </div>
    </div>
  );
}
