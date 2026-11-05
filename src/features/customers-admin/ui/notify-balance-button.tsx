"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Button } from "@/shared/ui/button";

type SendState = "idle" | "sending" | "sent" | "error";

export function NotifyBalanceButton({ tripId }: { tripId: string }) {
  const t = useTranslations("Dashboard.CustomerProfile");
  const [state, setState] = useState<SendState>("idle");

  const notify = async () => {
    if (state === "sending") return;
    setState("sending");
    try {
      const response = await fetch(
        `/api/admin/invoices/${encodeURIComponent(tripId)}`,
        { method: "POST" },
      );
      setState(response.ok ? "sent" : "error");
    } catch {
      setState("error");
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-auto min-h-11 whitespace-normal text-center"
      disabled={state === "sending" || state === "sent"}
      onClick={() => void notify()}
    >
      {state === "sending" ? (
        <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
      ) : null}
      {state === "sent"
        ? t("notified")
        : state === "error"
          ? t("notify-failed")
          : t("notify-pay")}
    </Button>
  );
}
