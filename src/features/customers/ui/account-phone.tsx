"use client";

import { useEffect, useState } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

export function AccountPhone({
  t,
  phone,
  onSaved,
}: {
  t: (k: string) => string;
  phone: string;
  onSaved: (verifiedPhone: string) => void;
}) {
  const [verifiedPhone, setVerifiedPhone] = useState(phone);
  const [input, setInput] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setVerifiedPhone(phone);
  }, [phone]);

  const request = async () => {
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch("/api/account/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: input }),
      });
      if (!res.ok) {
        setNotice(t("phone-send-failed"));
        return;
      }
      setSent(true);
      setNotice(t("code-sent"));
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch("/api/account/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setNotice(t("code-invalid"));
        return;
      }
      setVerifiedPhone(data.phone);
      onSaved(data.phone);
      setSent(false);
      setCode("");
      setInput("");
      setNotice(t("phone-verified"));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch("/api/account/phone", { method: "DELETE" });
      if (res.ok) {
        setVerifiedPhone("");
        setSent(false);
        onSaved("");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{t("verified-phone")}</Label>
      {verifiedPhone ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm">{verifiedPhone}</span>
          <Button className="h-11" type="button" variant="outline" onClick={remove} disabled={busy}>
            {t("remove-phone")}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            className="h-11 text-base"
            inputMode="tel"
            placeholder={t("phone")}
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />
          <Button className="h-11" type="button" onClick={request} disabled={busy || !input.trim()}>
            {t("send-code")}
          </Button>
        </div>
      )}
      {!verifiedPhone && sent ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            className="h-11 text-base"
            inputMode="numeric"
            placeholder={t("code")}
            value={code}
            onChange={(event) => setCode(event.target.value)}
          />
          <Button className="h-11" type="button" onClick={verify} disabled={busy || code.length !== 6}>
            {t("verify")}
          </Button>
        </div>
      ) : null}
      {notice ? <p role="status" className="text-sm text-muted-foreground">{notice}</p> : null}
    </div>
  );
}
