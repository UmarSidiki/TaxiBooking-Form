"use client";

import { LoaderCircle } from "lucide-react";
import type { CSSProperties, FormEvent } from "react";
import { useTranslations } from "next-intl";

import { useBookingForm } from "@/features/booking/context/booking-form-context";
import { useStep1 } from "@/features/booking/hooks/form-steps/useStep1";
import { useBookingStops } from "@/features/booking/hooks/useBookingStops";
import { useIframeBodyResize } from "@/features/booking/hooks/useIframeBodyResize";
import { v4ToneVars } from "@/features/booking/ui/embeddable/v4/embeddable-v4-ink";
import { EmbeddableV4JourneyFields } from "@/features/booking/ui/embeddable/v4/embeddable-v4-journey-fields";
import { EmbeddableV4RouteFields } from "@/features/booking/ui/embeddable/v4/embeddable-v4-route-fields";
import { useTheme } from "@/features/settings/context/theme-context";
import "@/features/booking/ui/embeddable/v4/embeddable-v4.css";
import "@/features/booking/ui/embeddable/v4/embeddable-v4-fields.css";
import "@/features/booking/ui/embeddable/v4/embeddable-v4-journey.css";
import "@/features/booking/ui/embeddable/v4/embeddable-v4-route.css";
import "@/shared/style/embeddable-layout.css";

export function EmbeddableV4Form() {
  const t = useTranslations();
  const { settings } = useTheme();
  const { setFormData } = useBookingForm();
  const step = useStep1();
  const stops = useBookingStops(step.formData, setFormData);
  useIframeBodyResize();

  const minDate = new Date().toISOString().split("T")[0];
  const busy = step.isLoading || step.calculatingDistance;
  const tone = v4ToneVars({
    panel: settings?.primaryColor,
    button: settings?.secondaryColor,
    radiusRem: settings?.borderRadius,
  }) as CSSProperties;

  const changeBookingType = (type: "destination" | "hourly") => {
    step.handleBookingTypeChange(type);
    if (type === "hourly") step.handleTripTypeChange("oneway");
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const redirected = step.redirectToStep2();
    if (!redirected) {
      window.setTimeout(() => {
        document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
      }, 0);
    }
  };

  return (
    <main className="mx-auto w-full max-w-3xl p-1.5 font-sans sm:p-4">
      <article className="embeddable-v4-card" style={tone}>
        <h1 className="v4-title">{t("embeddable.book-your-ride")}</h1>
        <form onSubmit={submit} noValidate>
          <div className="v4-columns">
            <EmbeddableV4RouteFields
              t={t}
              formData={step.formData}
              errors={step.errors}
              pickupInputRef={step.pickupInputRef}
              dropoffInputRef={step.dropoffInputRef}
              stopInputRefs={step.stopInputRefs}
              onBookingType={changeBookingType}
              onInput={step.handleInputChange}
              onBlur={step.handleInputBlur}
              onAddStop={stops.handleAddStop}
              onRemoveStop={stops.handleRemoveStop}
              onStopChange={stops.handleStopChange}
            />
            <EmbeddableV4JourneyFields
              t={t}
              formData={step.formData}
              errors={step.errors}
              minDate={minDate}
              onInput={step.handleInputChange}
              onBlur={step.handleInputBlur}
              onTripType={step.handleTripTypeChange}
            />
          </div>
          <footer className="v4-footer">
            <button type="submit" className="v4-submit" disabled={busy}>
              {busy ? (
                <>
                  <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                  {t("embeddable.calculating-fare")}
                </>
              ) : (
                t("embeddable.calculate-fare")
              )}
            </button>
          </footer>
        </form>
      </article>
    </main>
  );
}
