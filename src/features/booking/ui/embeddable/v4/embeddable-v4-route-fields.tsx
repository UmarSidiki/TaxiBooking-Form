"use client";

import { ArrowDownUp, Plus } from "lucide-react";
import type { MutableRefObject, RefObject } from "react";
import type { useTranslations } from "next-intl";

import type { FormData, FormErrors } from "@/features/booking/context/booking-form-context";
import { EmbeddableV4HourlyRoute } from "@/features/booking/ui/embeddable/v4/embeddable-v4-hourly-route";
import { EmbeddableV4RouteRow } from "@/features/booking/ui/embeddable/v4/embeddable-v4-route-row";

type TFn = ReturnType<typeof useTranslations>;

type Props = {
  t: TFn;
  formData: FormData;
  errors: FormErrors;
  pickupInputRef: RefObject<HTMLInputElement | null>;
  dropoffInputRef: RefObject<HTMLInputElement | null>;
  stopInputRefs: MutableRefObject<Array<HTMLInputElement | null>>;
  onBookingType: (type: FormData["bookingType"]) => void;
  onInput: (field: string, value: string | number) => void;
  onBlur: (field: string) => void;
  onAddStop: () => void;
  onRemoveStop: (index: number) => void;
  onStopChange: (index: number, value: string) => void;
};

export function EmbeddableV4RouteFields(props: Props) {
  const { t, formData, errors } = props;
  const isHourly = formData.bookingType === "hourly";
  const placeholder = t("embeddable.street-placeholder");

  const swapLocations = () => {
    props.onInput("pickup", formData.dropoff);
    props.onInput("dropoff", formData.pickup);
  };

  return (
    <section aria-labelledby="v4-route-title">
      <div className="v4-head">
        <h2 id="v4-route-title" className="v4-kicker">
          {t("embeddable.where-are-you-going")}
        </h2>
        <div className="v4-modes">
          {(["destination", "hourly"] as const).map((type) => (
            <button
              key={type}
              type="button"
              aria-pressed={formData.bookingType === type}
              onClick={() => props.onBookingType(type)}
            >
              {t(`embeddable.${type}`)}
            </button>
          ))}
        </div>
      </div>

      {isHourly ? (
        <EmbeddableV4HourlyRoute
          t={t}
          placeholder={placeholder}
          pickup={formData.pickup}
          duration={formData.duration}
          pickupError={errors.pickup}
          pickupInputRef={props.pickupInputRef}
          onInput={props.onInput}
          onBlur={props.onBlur}
        />
      ) : (
        <div className="v4-stops">
          <EmbeddableV4RouteRow
            id="v4-pickup"
            prefix={t("embeddable.from-prefix")}
            placeholder={placeholder}
            value={formData.pickup}
            marker="start"
            error={errors.pickup}
            inputRef={props.pickupInputRef}
            onChange={(value) => props.onInput("pickup", value)}
            onBlur={() => props.onBlur("pickup")}
          />
          {formData.stops.map((stop, index) => (
            <EmbeddableV4RouteRow
              key={stop.order}
              id={`v4-stop-${index}`}
              prefix={t("embeddable.via-prefix")}
              placeholder={placeholder}
              value={stop.location}
              marker="via"
              inputRef={(element) => {
                props.stopInputRefs.current[index] = element;
              }}
              removeLabel={t("embeddable.remove-stop", { number: index + 1 })}
              onChange={(value) => props.onStopChange(index, value)}
              onRemove={() => props.onRemoveStop(index)}
            />
          ))}
          <EmbeddableV4RouteRow
            id="v4-dropoff"
            prefix={t("embeddable.to-prefix")}
            placeholder={placeholder}
            value={formData.dropoff}
            marker="end"
            error={errors.dropoff}
            inputRef={props.dropoffInputRef}
            onChange={(value) => props.onInput("dropoff", value)}
            onBlur={() => props.onBlur("dropoff")}
          />
          <button type="button" className="v4-swap" aria-label={t("embeddable.swap-locations")} onClick={swapLocations}>
            <ArrowDownUp className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {isHourly ? null : (
        <button type="button" className="v4-add" onClick={props.onAddStop}>
          <Plus className="size-4" aria-hidden="true" />
          {t("embeddable.add-a-stop")}
        </button>
      )}
    </section>
  );
}
