"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations<"Dashboard.Admin.Partners">>;

export function AdminPartnerSettleDialog({
  t,
  partnerId,
  open,
  onOpenChange,
  onSettled,
}: {
  t: TFn;
  partnerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSettled: (balance: number) => void;
}) {
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState<"pay_partner" | "receive_from_partner">("pay_partner");
  const [method, setMethod] = useState<"cash" | "bank" | "other">("bank");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/partners/${partnerId}/settlements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(amount),
          direction,
          method,
          reference: reference || undefined,
          note: note || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(t("settle-error"));
        return;
      }
      onSettled(typeof data.balance === "number" ? data.balance : 0);
      onOpenChange(false);
    } catch {
      setError(t("settle-error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("settle-title")}</DialogTitle>
          <DialogDescription>{t("settle-description")}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Label htmlFor="settle-amount">{t("settle-amount")}</Label>
          <Input id="settle-amount" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} className="h-11" />
          <Label htmlFor="settle-direction">{t("settle-direction")}</Label>
          <select id="settle-direction" className="h-11 rounded-md border border-border bg-background px-3" value={direction} onChange={(event) => setDirection(event.target.value as typeof direction)}>
            <option value="pay_partner">{t("settle-pay-partner")}</option>
            <option value="receive_from_partner">{t("settle-receive")}</option>
          </select>
          <Label htmlFor="settle-method">{t("settle-method")}</Label>
          <select id="settle-method" className="h-11 rounded-md border border-border bg-background px-3" value={method} onChange={(event) => setMethod(event.target.value as typeof method)}>
            <option value="bank">{t("settle-bank")}</option>
            <option value="cash">{t("settle-cash")}</option>
            <option value="other">{t("settle-other")}</option>
          </select>
          <Label htmlFor="settle-reference">{t("settle-reference")}</Label>
          <Input id="settle-reference" value={reference} onChange={(event) => setReference(event.target.value)} className="h-11" />
          <Label htmlFor="settle-note">{t("notes-label")}</Label>
          <Input id="settle-note" value={note} onChange={(event) => setNote(event.target.value)} className="h-11" />
          {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" className="h-11" onClick={() => onOpenChange(false)}>{t("close")}</Button>
          <Button className="h-11" disabled={saving || !(Number(amount) > 0)} onClick={() => void submit()}>
            {saving ? t("settle-saving") : t("settle-save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
