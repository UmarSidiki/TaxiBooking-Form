"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";

export function UnsubscribeResubscribe({ token }: { token: string }) {
  const t = useTranslations("Unsubscribe");
  const [state, setState] = useState<"idle" | "pending" | "done" | "error">(
    "idle",
  );

  const resubscribe = async () => {
    setState("pending");
    try {
      const response = await fetch("/api/marketing/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, action: "resubscribe" }),
      });
      setState(response.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  };

  if (state === "done") {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        {t("resubscribed")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        className="min-h-11"
        disabled={state === "pending"}
        onClick={() => void resubscribe()}
      >
        {state === "pending" ? t("resubscribing") : t("resubscribe")}
      </Button>
      {state === "error" ? (
        <p role="alert" className="text-sm text-destructive">
          {t("resubscribe-failed")}
        </p>
      ) : null}
    </div>
  );
}
