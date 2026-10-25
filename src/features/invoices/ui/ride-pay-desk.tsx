"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { useCurrency } from "@/shared/context/currency-context";

const StripeProvider = dynamic(() => import("@/features/payments/ui/stripe-provider"), { ssr: false });
const StripePaymentForm = dynamic(() => import("@/features/payments/ui/stripe-payment-form"), { ssr: false });

type Bank = { name: string; accountName: string; accountNumber: string; iban: string; swift: string };
type Summary = {
  tripId: string;
  pickup: string;
  dropoff?: string;
  date: string;
  time: string;
  total: number;
  amountDue: number;
  balanceDue: number;
  currency: string;
  publishableKey?: string | null;
  bank: Bank;
};

export function RidePayDesk({ token }: { token: string }) {
  const t = useTranslations("Pay");
  const { currencySymbol } = useCurrency();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [state, setState] = useState<"loading" | "cash" | "stripe" | "paid" | "missing" | "error">("loading");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/pay/ride/${encodeURIComponent(token)}`, { method: "POST" })
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) return;
        if (!data.ok) {
          setState(data.error === "not_found" ? "missing" : "error");
          return;
        }
        setSummary(data.summary ?? data);
        if (data.state === "paid" || (data.summary?.amountDue ?? data.amountDue) <= 0) {
          setState("paid");
          return;
        }
        if (data.state === "multisafepay" && data.paymentUrl) {
          window.location.href = data.paymentUrl;
          return;
        }
        if (data.state === "stripe" && data.clientSecret) {
          setClientSecret(data.clientSecret);
          setState("stripe");
          return;
        }
        setState("cash");
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const confirm = async (paymentIntentId: string) => {
    const response = await fetch(`/api/pay/ride/${encodeURIComponent(token)}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentIntentId }),
    });
    if (!response.ok) {
      setError(t("payment-init-failed"));
      return;
    }
    setState("paid");
  };

  if (state === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <p className="flex items-center gap-2 text-muted-foreground"><Loader2 className="size-5 animate-spin" />{t("loading")}</p>
      </main>
    );
  }

  if (state === "missing" || state === "error") {
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md p-6"><h1 className="text-xl font-semibold">{t("link-invalid-title")}</h1><p className="mt-2 text-sm text-muted-foreground">{t("link-invalid-body")}</p></Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="flex w-full max-w-lg flex-col gap-4 p-6">
        <h1 className="text-2xl font-semibold">{state === "paid" ? t("paid-in-full") : t("pay-to-confirm")}</h1>
        {summary ? (
          <div className="flex flex-col gap-1 rounded-lg border border-border p-4 text-sm">
            <p>{summary.pickup}{summary.dropoff ? ` → ${summary.dropoff}` : ""}</p>
            <p className="text-muted-foreground">{summary.date} · {summary.time}</p>
            <p className="pt-2">{t("trip-total")}: {currencySymbol}{summary.total.toFixed(2)}</p>
            <p className="text-lg font-semibold">{t("due-now")}: {currencySymbol}{summary.amountDue.toFixed(2)}</p>
            <p>{t("balance-due")}: {currencySymbol}{summary.balanceDue.toFixed(2)}</p>
          </div>
        ) : null}
        {state === "cash" && summary ? (
          <div className="flex flex-col gap-2 text-sm">
            <p>{t("cash-instructions")}</p>
            <h2 className="font-semibold">{t("bank-details")}</h2>
            <p>{summary.bank.name}</p>
            <p>{summary.bank.accountName}</p>
            <p>{summary.bank.iban || summary.bank.accountNumber}</p>
            <p>{summary.bank.swift}</p>
          </div>
        ) : null}
        {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
        {state === "stripe" && clientSecret && summary?.publishableKey ? (
          <StripeProvider publishableKey={summary.publishableKey} clientSecret={clientSecret}>
            <StripePaymentForm
              amount={summary.amountDue}
              currency={summary.currency}
              onSuccess={(paymentIntentId) => void confirm(paymentIntentId)}
              onError={(message) => setError(message)}
            />
          </StripeProvider>
        ) : null}
        {state === "stripe" && !summary?.publishableKey ? (
          <Button className="min-h-11" disabled>{t("payment-init-failed")}</Button>
        ) : null}
      </Card>
    </main>
  );
}
