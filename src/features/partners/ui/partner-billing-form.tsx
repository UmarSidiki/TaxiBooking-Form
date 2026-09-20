"use client";

import type { PartnerBillingFormState } from "@/features/partners/hooks/usePartnerBilling";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { Loader2 } from "lucide-react";
import type { useTranslations } from "next-intl";

type TFn = ReturnType<typeof useTranslations<"Dashboard.Partners.Billing">>;

export function PartnerBillingForm({
  t,
  formState,
  saving,
  error,
  success,
  handleChange,
  handleSubmit,
}: {
  t: TFn;
  formState: PartnerBillingFormState;
  saving: boolean;
  error: string | null;
  success: string | null;
  handleChange: (
    field: keyof PartnerBillingFormState
  ) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Card className="desk-card border-border">
      <CardHeader>
        <CardTitle>{t("form-title")}</CardTitle>
        <CardDescription>{t("form-description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={handleSubmit}>
          {error ? (
            <p className="rounded-md border border-border bg-card px-4 py-3 text-sm" role="alert">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="rounded-md border border-border bg-card px-4 py-3 text-sm" role="status">
              {success}
            </p>
          ) : null}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="accountHolder">{t("account-holder")}</Label>
              <Input
                id="accountHolder"
                className="h-11"
                value={formState.accountHolder}
                onChange={handleChange("accountHolder")}
                placeholder={t("account-holder-placeholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankName">{t("bank-name")}</Label>
              <Input
                id="bankName"
                className="h-11"
                value={formState.bankName}
                onChange={handleChange("bankName")}
                placeholder={t("bank-name-placeholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountNumber">{t("account-number")}</Label>
              <Input
                id="accountNumber"
                className="h-11"
                value={formState.accountNumber}
                onChange={handleChange("accountNumber")}
                placeholder={t("account-number-placeholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="iban">{t("iban")}</Label>
              <Input
                id="iban"
                className="h-11"
                value={formState.iban}
                onChange={handleChange("iban")}
                placeholder={t("iban-placeholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="swift">{t("swift")}</Label>
              <Input
                id="swift"
                className="h-11"
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
          <Button type="submit" disabled={saving} className="h-11 w-full md:w-auto">
            {saving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                {t("saving")}
              </span>
            ) : (
              t("save-button")
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
