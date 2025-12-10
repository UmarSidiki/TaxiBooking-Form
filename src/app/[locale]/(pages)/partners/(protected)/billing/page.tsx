"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, CheckCircle2, Loader2, PiggyBank } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface BillingDetailsResponse {
  success: boolean;
  billingDetails: {
    accountHolder?: string;
    bankName?: string;
    accountNumber?: string;
    iban?: string;
    swift?: string;
    notes?: string;
  };
  payoutBalance: number;
  lastPayoutAt: string | null;
  error?: string;
}

interface BillingFormState {
  accountHolder: string;
  bankName: string;
  accountNumber: string;
  iban: string;
  swift: string;
  notes: string;
}

const defaultFormState: BillingFormState = {
  accountHolder: "",
  bankName: "",
  accountNumber: "",
  iban: "",
  swift: "",
  notes: "",
};

export default function PartnerBillingPage() {
  const t = useTranslations("Dashboard.Partners.Billing");
  const [formState, setFormState] = useState<BillingFormState>(defaultFormState);
  const [payoutBalance, setPayoutBalance] = useState(0);
  const [lastPayoutAt, setLastPayoutAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const formattedBalance = useMemo(() => {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "EUR",
    }).format(payoutBalance || 0);
  }, [payoutBalance]);

  const formattedLastPaid = useMemo(() => {
    if (!lastPayoutAt) {
      return t("never");
    }

    const date = new Date(lastPayoutAt);
    if (Number.isNaN(date.getTime())) {
      return t("never");
    }
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, [lastPayoutAt, t]);

  const fetchBillingDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/partners/billing");
      const data: BillingDetailsResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to load billing details");
      }

      setFormState({
        accountHolder: data.billingDetails.accountHolder || "",
        bankName: data.billingDetails.bankName || "",
        accountNumber: data.billingDetails.accountNumber || "",
        iban: data.billingDetails.iban || "",
        swift: data.billingDetails.swift || "",
        notes: data.billingDetails.notes || "",
      });
      setPayoutBalance(data.payoutBalance || 0);
      setLastPayoutAt(data.lastPayoutAt || null);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch billing details", err);
      setError(t("load-error"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchBillingDetails();
  }, [fetchBillingDetails]);

  const handleChange = (field: keyof BillingFormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormState((prev) => ({
        ...prev,
        [field]: event.target.value,
      }));
    };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setSuccess(null);
    setError(null);

    try {
      const response = await fetch("/api/partners/billing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formState),
      });

      const data: BillingDetailsResponse = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to save billing details");
      }

      setSuccess(t("save-success"));
      setPayoutBalance(data.payoutBalance || 0);
      setLastPayoutAt(data.lastPayoutAt || null);
    } catch (err) {
      console.error("Failed to save billing details", err);
      setError(t("save-error"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          {t("description")}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-gradient-to-br from-primary/5 via-background to-background border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("payout-summary-title")}
            </CardTitle>
            <PiggyBank className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{formattedBalance}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("payout-summary-description")}
            </p>
            <div className="mt-4 text-sm text-muted-foreground">
              {t("last-paid", { date: formattedLastPaid })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              {t("instructions-title")}
            </CardTitle>
            <CardDescription>{t("instructions-description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>{t("instructions-1")}</li>
              <li>{t("instructions-2")}</li>
              <li>{t("instructions-3")}</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("form-title")}</CardTitle>
          <CardDescription>{t("form-description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t("error-title")}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert variant="success">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>{t("success-title")}</AlertTitle>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="accountHolder">{t("account-holder")}</Label>
                <Input
                  id="accountHolder"
                  value={formState.accountHolder}
                  onChange={handleChange("accountHolder")}
                  placeholder={t("account-holder-placeholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankName">{t("bank-name")}</Label>
                <Input
                  id="bankName"
                  value={formState.bankName}
                  onChange={handleChange("bankName")}
                  placeholder={t("bank-name-placeholder")}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="accountNumber">{t("account-number")}</Label>
                <Input
                  id="accountNumber"
                  value={formState.accountNumber}
                  onChange={handleChange("accountNumber")}
                  placeholder={t("account-number-placeholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="iban">{t("iban")}</Label>
                <Input
                  id="iban"
                  value={formState.iban}
                  onChange={handleChange("iban")}
                  placeholder={t("iban-placeholder")}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="swift">{t("swift")}</Label>
                <Input
                  id="swift"
                  value={formState.swift}
                  onChange={handleChange("swift")}
                  placeholder={t("swift-placeholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">{t("notes")}</Label>
                <Textarea
                  id="notes"
                  value={formState.notes}
                  onChange={handleChange("notes")}
                  placeholder={t("notes-placeholder")}
                  className="min-h-[96px]"
                />
              </div>
            </div>

            <Button type="submit" disabled={saving} className="w-full md:w-auto">
              {saving ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("saving")}
                </span>
              ) : (
                t("save-button")
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
