"use client";

import type { useTranslations } from "next-intl";

import type {
  DeskBookingFormValues,
  DeskPaymentMethod,
} from "@/features/desk-booking/hooks/use-desk-booking-form";
import type { DeskBookingOutcome } from "@/features/desk-booking/schema/desk-booking.schema";
import { deskControlClassName } from "@/features/dashboard/ui/desk-toolbar";
import { useCurrency } from "@/shared/context/currency-context";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Switch } from "@/shared/ui/switch";

type TFn = ReturnType<typeof useTranslations>;

export function DeskBookingPriceFields({
  t,
  formData,
  update,
  computedTotal,
  effectiveTotal,
  manualPriceInvalid,
}: {
  t: TFn;
  formData: DeskBookingFormValues;
  update: (patch: Partial<DeskBookingFormValues>) => void;
  computedTotal: number;
  effectiveTotal: number;
  manualPriceInvalid: boolean;
}) {
  const { currencySymbol } = useCurrency();
  const isQuote = formData.outcome === "quote";

  return (
    <section className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-foreground">
        {t("Dashboard.Rides.section-outcome")}
      </h3>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="desk-outcome">{t("Dashboard.Rides.outcome")}</Label>
        <Select
          value={formData.outcome}
          onValueChange={(value) =>
            update({ outcome: value as DeskBookingOutcome })
          }
        >
          <SelectTrigger id="desk-outcome" className={deskControlClassName}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="confirmed">
              {t("Dashboard.Rides.outcome-confirmed")}
            </SelectItem>
            <SelectItem value="quote">
              {t("Dashboard.Rides.outcome-quote")}
            </SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {isQuote
            ? t("Dashboard.Rides.outcome-quote-help")
            : t("Dashboard.Rides.outcome-confirmed-help")}
        </p>
      </div>

      <div className="rounded-lg border border-border p-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">
            {t("Dashboard.Rides.computed-fare")}
          </span>
          <span className="tabular-nums">
            {currencySymbol}
            {computedTotal.toFixed(2)}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-border pt-2 font-semibold">
          <span>{t("Dashboard.Rides.TotalAmount")}</span>
          <span className="tabular-nums">
            {currencySymbol}
            {effectiveTotal.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="desk-manualPrice">
          {t("Dashboard.Rides.manual-price")}
        </Label>
        <Input
          id="desk-manualPrice"
          type="number"
          min={0}
          step="0.01"
          inputMode="decimal"
          value={formData.manualPrice}
          onChange={(event) => update({ manualPrice: event.target.value })}
          aria-invalid={manualPriceInvalid}
        />
        <p className="text-xs text-muted-foreground">
          {manualPriceInvalid
            ? t("Dashboard.Rides.manual-price-invalid")
            : t("Dashboard.Rides.manual-price-help")}
        </p>
      </div>

      {!isQuote ? (
        <>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="desk-paymentMethod">
              {t("Step3.payment-method")}
            </Label>
            <Select
              value={formData.paymentMethod}
              onValueChange={(value) =>
                update({ paymentMethod: value as DeskPaymentMethod })
              }
            >
              <SelectTrigger
                id="desk-paymentMethod"
                className={deskControlClassName}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">
                  {t("Step3.cash-payment")}
                </SelectItem>
                <SelectItem value="card">
                  {t("Step3.credit-debit-card")}
                </SelectItem>
                <SelectItem value="bank_transfer">
                  {t("Step3.bank-transfer")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <label
              htmlFor="desk-paymentCollected"
              className="cursor-pointer text-sm font-medium text-foreground"
            >
              {t("Dashboard.Rides.payment-collected")}
            </label>
            <Switch
              id="desk-paymentCollected"
              checked={formData.paymentCollected}
              onCheckedChange={(checked) =>
                update({ paymentCollected: checked })
              }
            />
          </div>
        </>
      ) : null}

      <div className="flex items-center justify-between">
        <label
          htmlFor="desk-notifyCustomer"
          className="cursor-pointer text-sm font-medium text-foreground"
        >
          {t("Dashboard.Rides.notify-customer")}
        </label>
        <Switch
          id="desk-notifyCustomer"
          checked={formData.notifyCustomer}
          onCheckedChange={(checked) => update({ notifyCustomer: checked })}
        />
      </div>
    </section>
  );
}
