"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useCurrency } from "@/shared/context/currency-context";

export interface PartnerBillingFormState {
  accountHolder: string;
  bankName: string;
  accountNumber: string;
  iban: string;
  swift: string;
  notes: string;
}

const emptyForm: PartnerBillingFormState = {
  accountHolder: "",
  bankName: "",
  accountNumber: "",
  iban: "",
  swift: "",
  notes: "",
};

export function usePartnerBilling() {
  const t = useTranslations("Dashboard.Partners.Billing");
  const locale = useLocale();
  const { currency } = useCurrency();
  const [formState, setFormState] = useState<PartnerBillingFormState>(emptyForm);
  const [payoutBalance, setPayoutBalance] = useState(0);
  const [lastPayoutAt, setLastPayoutAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const formattedBalance = useMemo(
    () =>
      new Intl.NumberFormat(locale, { style: "currency", currency }).format(payoutBalance || 0),
    [currency, locale, payoutBalance]
  );

  const formattedLastPaid = useMemo(() => {
    if (!lastPayoutAt) return t("never");
    const date = new Date(lastPayoutAt);
    if (Number.isNaN(date.getTime())) return t("never");
    return date.toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });
  }, [lastPayoutAt, locale, t]);

  const fetchBillingDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/partners/billing");
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(t("load-error"));
        return;
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
    } catch {
      setError(t("load-error"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void fetchBillingDetails();
  }, [fetchBillingDetails]);

  const handleChange =
    (field: keyof PartnerBillingFormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormState((prev) => ({ ...prev, [field]: event.target.value }));
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
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(t("save-error"));
        return;
      }
      setSuccess(t("save-success"));
      setPayoutBalance(data.payoutBalance || 0);
      setLastPayoutAt(data.lastPayoutAt || null);
    } catch {
      setError(t("save-error"));
    } finally {
      setSaving(false);
    }
  };

  return {
    t,
    formState,
    formattedBalance,
    formattedLastPaid,
    loading,
    saving,
    error,
    success,
    handleChange,
    handleSubmit,
  };
}
