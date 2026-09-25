"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Loader2 } from "lucide-react";
import { useCurrency } from "@/shared/context/currency-context";
import { useTheme } from "@/features/settings/context/theme-context";
import { ensurePaymentFinalized } from "@/features/payments/lib/complete-payment";
import { resolvePostBookingRedirect } from "@/features/payments/lib/resolve-post-booking-redirect";

const StripeProvider = dynamic(
  () => import("@/features/payments/ui/stripe-provider"),
  { ssr: false }
);
const StripePaymentForm = dynamic(
  () => import("@/features/payments/ui/stripe-payment-form"),
  { ssr: false }
);

type PayState =
  | "loading"
  | "awaiting_payment"
  | "already_paid"
  | "declined"
  | "not_found"
  | "error";

type PaySummary = {
  tripId: string;
  pickup: string;
  dropoff?: string;
  date: string;
  time: string;
  totalAmount: number;
  vehicleName?: string;
  firstName?: string;
};

export default function PayQuotePage() {
  const t = useTranslations("Pay");
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const token = String(params.token || "");
  const { currencySymbol } = useCurrency();
  const { settings } = useTheme();

  const [state, setState] = useState<PayState>("loading");
  const [summary, setSummary] = useState<PaySummary | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [publishableKey, setPublishableKey] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState("loading");
    try {
      const res = await fetch(`/api/pay/${encodeURIComponent(token)}`);
      const data = await res.json();
      if (!data.success) {
        setState(data.state === "not_found" ? "not_found" : "error");
        return;
      }
      if (data.state === "awaiting_payment") {
        setSummary(data);
        setState("awaiting_payment");
        return;
      }
      setState(data.state as PayState);
      if (data.tripId) {
        setSummary({ tripId: data.tripId } as PaySummary);
      }
    } catch {
      setState("error");
    }
  }, [token]);

  useEffect(() => {
    if (token) void load();
  }, [token, load]);

  const startStripe = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/pay/${encodeURIComponent(token)}/intent`, {
        method: "POST",
      });
      const data = await res.json();
      if (!data.success || !data.clientSecret) {
        setError(t("payment-init-failed"));
        return;
      }
      setClientSecret(data.clientSecret);
      setPublishableKey(data.publishableKey);
      setOrderId(data.orderId);
    } catch {
      setError(t("payment-init-failed"));
    } finally {
      setBusy(false);
    }
  };

  const startMultisafepay = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/pay/${encodeURIComponent(token)}/multisafepay`,
        { method: "POST" }
      );
      const data = await res.json();
      if (data.success && data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }
      setError(t("payment-init-failed"));
    } catch {
      setError(t("payment-init-failed"));
    } finally {
      setBusy(false);
    }
  };

  const onStripeSuccess = async (paymentIntentId: string) => {
    setBusy(true);
    try {
      await ensurePaymentFinalized({
        provider: "stripe",
        paymentIntentId,
        orderId: orderId || undefined,
      });
      const target = resolvePostBookingRedirect(
        settings,
        `/${locale}/thank-you?tripId=${orderId || summary?.tripId || ""}&amount=${summary?.totalAmount?.toFixed(2) || ""}&method=stripe`
      );
      await router.push(target);
    } catch {
      await router.push(`/${locale}/thank-you?method=stripe`);
    } finally {
      setBusy(false);
    }
  };

  if (state === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </main>
    );
  }

  if (state === "not_found" || state === "error") {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 flex flex-col gap-3">
          <h1 className="text-xl font-semibold">{t("link-invalid-title")}</h1>
          <p className="text-sm text-muted-foreground">{t("link-invalid-body")}</p>
        </Card>
      </main>
    );
  }

  if (state === "declined") {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 flex flex-col gap-3">
          <h1 className="text-xl font-semibold">{t("declined-title")}</h1>
          <p className="text-sm text-muted-foreground">{t("declined-body")}</p>
        </Card>
      </main>
    );
  }

  if (state === "already_paid") {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 flex flex-col gap-3">
          <h1 className="text-xl font-semibold">{t("already-paid-title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("already-paid-body", { tripId: summary?.tripId || "" })}
          </p>
        </Card>
      </main>
    );
  }

  const methods = settings?.acceptedPaymentMethods || [];
  const stripeOk =
    Boolean(settings?.stripePublishableKey) && methods.includes("card");
  const mspOk =
    Boolean(settings?.hasMultisafepayApiKey) &&
    methods.includes("multisafepay");

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-lg w-full p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {t("by-appointment")}
          </p>
          <h1 className="text-2xl font-semibold">{t("pay-to-confirm")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("quote-summary", { tripId: summary?.tripId || "" })}
          </p>
        </div>

        {summary ? (
          <div className="rounded-lg border border-border p-4 text-sm flex flex-col gap-1">
            <p>
              {summary.pickup}
              {summary.dropoff ? ` → ${summary.dropoff}` : ""}
            </p>
            <p>
              {summary.date} · {summary.time}
            </p>
            {summary.vehicleName ? <p>{summary.vehicleName}</p> : null}
            <p className="text-lg font-semibold tabular-nums pt-2">
              {currencySymbol}
              {Number(summary.totalAmount).toFixed(2)}
            </p>
          </div>
        ) : null}

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        {!clientSecret ? (
          <div className="flex flex-col gap-2">
            {stripeOk ? (
              <Button
                className="min-h-11 w-full"
                disabled={busy}
                onClick={startStripe}
              >
                {busy ? (
                  <Loader2 className="animate-spin" data-icon="inline-start" />
                ) : null}
                {t("pay-with-card")}
              </Button>
            ) : null}
            {mspOk ? (
              <Button
                variant="secondary"
                className="min-h-11 w-full"
                disabled={busy}
                onClick={startMultisafepay}
              >
                {t("pay-with-multisafepay")}
              </Button>
            ) : null}
            {!stripeOk && !mspOk ? (
              <p className="text-sm text-muted-foreground">
                {t("no-payment-methods")}
              </p>
            ) : null}
          </div>
        ) : publishableKey && clientSecret ? (
          <StripeProvider
            publishableKey={publishableKey}
            clientSecret={clientSecret}
          >
            <StripePaymentForm
              amount={summary?.totalAmount || 0}
              currency={settings?.stripeCurrency || "eur"}
              onSuccess={onStripeSuccess}
              onError={(msg) => setError(msg)}
            />
          </StripeProvider>
        ) : null}
      </Card>
    </main>
  );
}
