"use client";

import type { FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Plus, X } from "lucide-react";

import { useDeskBookingForm } from "@/features/desk-booking/hooks/use-desk-booking-form";
import { isPlacesAutocompleteEvent } from "@/features/booking/lib/maps/place-autocomplete";
import { DeskBookingCustomerFields } from "@/features/desk-booking/ui/desk-booking-customer-fields";
import { DeskBookingPriceFields } from "@/features/desk-booking/ui/desk-booking-price-fields";
import { DeskBookingTripFields } from "@/features/desk-booking/ui/desk-booking-trip-fields";
import { Button } from "@/shared/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/shared/ui/sheet";

interface NewDeskBookingDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (tripId: string, payLinkEmailSent?: boolean) => void;
}

export function NewDeskBookingDrawer({
  open,
  onOpenChange,
  onCreated,
}: NewDeskBookingDrawerProps) {
  const t = useTranslations();
  const form = useDeskBookingForm({ open, onCreated });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await form.submit();
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) form.reset();
    onOpenChange(next);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col overflow-hidden p-0 sm:max-w-[54rem] [&>button]:hidden"
        onInteractOutside={(event) => {
          // Google's suggestion list lives outside the sheet; picking an
          // address with the mouse must not dismiss the drawer.
          if (isPlacesAutocompleteEvent(event)) event.preventDefault();
        }}
      >
        <SheetHeader className="flex-none border-b border-border/60 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <SheetTitle className="truncate text-sm font-semibold text-foreground sm:text-base">
                {t("Dashboard.Rides.new-booking-title")}
              </SheetTitle>
              <p className="mt-0.5 truncate text-xs font-medium text-muted-foreground">
                {t("Dashboard.Rides.new-booking-help")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={t("Dashboard.Rides.cancel")}
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        </SheetHeader>

        <form
          id="desk-booking-form"
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <DeskBookingTripFields
                t={t}
                formData={form.formData}
                update={form.update}
                vehicles={form.vehicles}
                pickupRef={form.pickupRef}
                dropoffRef={form.dropoffRef}
                stopRefs={form.stopRefs}
              />
              <div className="flex flex-col gap-6">
                <DeskBookingCustomerFields
                  t={t}
                  formData={form.formData}
                  update={form.update}
                />
                <DeskBookingPriceFields
                  t={t}
                  formData={form.formData}
                  update={form.update}
                  computedTotal={form.computedFare?.total ?? 0}
                  effectiveTotal={form.effectiveTotal}
                  manualPriceInvalid={form.manualPriceInvalid}
                />
              </div>
            </div>

            {form.error ? (
              <p role="alert" className="mt-4 text-sm text-destructive">
                {form.error}
              </p>
            ) : null}
          </div>

          <div className="flex-none border-t border-border/60 bg-card/50 px-4 py-3 sm:px-6 sm:py-4">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-2.5">
              <Button
                type="submit"
                form="desk-booking-form"
                disabled={form.isSaving}
                className="h-11 w-full gap-1.5 rounded-xl font-semibold sm:h-10 sm:flex-1"
              >
                {form.isSaving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    {t("Dashboard.Settings.saving")}
                  </>
                ) : (
                  <>
                    <Plus className="size-4" aria-hidden="true" />
                    {t("Dashboard.Rides.create-booking")}
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                className="h-11 w-full rounded-xl px-4 sm:h-10 sm:w-auto"
              >
                {t("Dashboard.Rides.cancel")}
              </Button>
            </div>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
