"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

export function DriverTimeOffForm() {
  const t = useTranslations("Drivers");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [note, setNote] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setNotice(null);
    setError(null);
    const start = new Date(startsAt);
    const end = new Date(endsAt);
    if (!startsAt || !endsAt || !(end > start)) {
      setError(t("time-off-invalid"));
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/drivers/time-off", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startsAt: start.toISOString(),
          endsAt: end.toISOString(),
          note: note || undefined,
        }),
      });
      if (!response.ok) {
        setError(t("time-off-invalid"));
        return;
      }
      setNotice(t("time-off-saved"));
    } catch {
      setError(t("time-off-invalid"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-md border border-border bg-card p-4" aria-label={t("time-off-title")}>
      <h2 className="font-semibold">{t("time-off-title")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("time-off-help")}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="time-off-start">{t("time-off-start")}</Label>
          <Input id="time-off-start" type="datetime-local" className="h-11" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} />
        </div>
        <div>
          <Label htmlFor="time-off-end">{t("time-off-end")}</Label>
          <Input id="time-off-end" type="datetime-local" className="h-11" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} />
        </div>
      </div>
      <div className="mt-3">
        <Label htmlFor="time-off-note">{t("time-off-note")}</Label>
        <Input id="time-off-note" className="h-11" value={note} onChange={(event) => setNote(event.target.value)} />
      </div>
      <Button type="button" className="mt-3 h-11" disabled={busy} onClick={() => void save()}>
        {busy ? `${t("time-off-save")}…` : t("time-off-save")}
      </Button>
      {notice ? <p role="status" className="mt-2 text-sm">{notice}</p> : null}
      {error ? <p role="alert" className="mt-2 text-sm text-destructive">{error}</p> : null}
    </section>
  );
}
