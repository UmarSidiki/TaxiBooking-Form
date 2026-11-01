"use client";

import { Clock, Plus } from "lucide-react";
import type { Dispatch, RefObject, SetStateAction } from "react";
import type { useTranslations } from "next-intl";

import type {
  FormData,
  FormErrors,
} from "@/features/booking/context/booking-form-context";
import { STOP_WAIT_OPTIONS_15_MIN } from "@/features/booking/lib/stop-wait-duration-options";
import { RouteMarker } from "@/features/booking/ui/riviera/steps/route-marker";
import { RouteRailField } from "@/features/booking/ui/riviera/steps/route-rail-field";

type TFn = ReturnType<typeof useTranslations>;
type StopInputRefs = { current: Array<HTMLInputElement | null> };

type Props = {
  t: TFn;
  formData: FormData;
  setFormData: Dispatch<SetStateAction<FormData>>;
  errors: FormErrors;
  pickupInputRef: RefObject<HTMLInputElement | null>;
  dropoffInputRef: RefObject<HTMLInputElement | null>;
  stopInputRefs: StopInputRefs;
  handleInputBlur: (field: string) => void;
  handleAddStop: () => void;
  handleRemoveStop: (index: number) => void;
  handleStopChange: (index: number, location: string) => void;
  handleStopDurationChange: (index: number, duration: number) => void;
};

export function RouteRailFields({
  t,
  formData,
  setFormData,
  errors,
  pickupInputRef,
  dropoffInputRef,
  stopInputRefs,
  handleInputBlur,
  handleAddStop,
  handleRemoveStop,
  handleStopChange,
  handleStopDurationChange,
}: Props) {
  const hasRoute = formData.bookingType === "destination";

  return (
    <>
      <div className="route-rail">
        {hasRoute ? (
          <span
            className="route-rail__line"
            data-testid="route-rail"
            aria-hidden="true"
          />
        ) : null}

        <div className="route-rail__row">
          <RouteMarker kind="pickup" />
          <RouteRailField
            id="booking-pickup"
            label={t("Riviera.pickup")}
            placeholder={t("Step1.PickupPlaceholder")}
            value={formData.pickup}
            inputRef={pickupInputRef}
            locate
            invalid={Boolean(errors.pickup)}
            errorId="route-error-pickup"
            onChange={(value) =>
              setFormData((previous) => ({
                ...previous,
                pickup: value,
                pickupLatLng: null,
              }))
            }
            onBlur={() => {
              if (formData.pickup && formData.dropoff) {
                handleInputBlur("pickup");
              }
            }}
          />
        </div>
        {errors.pickup ? (
          <p id="route-error-pickup" role="alert" className="route-rail__error">
            {errors.pickup}
          </p>
        ) : null}

        {hasRoute
          ? formData.stops.map((stop, index) => (
              <div className="route-rail__row" key={index}>
                <RouteMarker kind="stop" number={index + 1} />
                <div className="route-rail__stop">
                  <RouteRailField
                    id={`booking-stop-${index}`}
                    label={t("embeddable.stop-index-1-location", {
                      0: index + 1,
                    })}
                    placeholder={t("embeddable.street-placeholder")}
                    value={stop.location}
                    inputRef={(element) => {
                      stopInputRefs.current[index] = element;
                    }}
                    removeLabel={t("embeddable.remove-stop", {
                      number: index + 1,
                    })}
                    onChange={(value) => handleStopChange(index, value)}
                    onRemove={() => handleRemoveStop(index)}
                  />
                  <div className="route-rail__wait">
                    <Clock className="route-rail__wait-icon" aria-hidden="true" />
                    <select
                      className="route-rail__wait-select"
                      data-testid="route-stop-wait"
                      aria-label={t("Step1.stop")}
                      value={stop.duration || 0}
                      onChange={(event) =>
                        handleStopDurationChange(
                          index,
                          Number.parseInt(event.target.value, 10),
                        )
                      }
                    >
                      {STOP_WAIT_OPTIONS_15_MIN.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))
          : null}

        {hasRoute && errors.stops ? (
          <p id="route-error-stops" role="alert" className="route-rail__error">
            {errors.stops}
          </p>
        ) : null}

        {hasRoute ? (
          <div className="route-rail__row">
            <RouteMarker kind="dropoff" />
            <RouteRailField
              id="booking-dropoff"
              label={t("Riviera.dropoff")}
              placeholder={t("Step1.DropoffPlaceholder")}
              value={formData.dropoff}
              inputRef={dropoffInputRef}
              invalid={Boolean(errors.dropoff)}
              errorId="route-error-dropoff"
              onChange={(value) =>
                setFormData((previous) => ({
                  ...previous,
                  dropoff: value,
                  dropoffLatLng: null,
                }))
              }
              onBlur={() => {
                if (formData.pickup && formData.dropoff) {
                  handleInputBlur("dropoff");
                }
              }}
            />
          </div>
        ) : null}

        {errors.dropoff ? (
          <p
            id="route-error-dropoff"
            role="alert"
            className="route-rail__error route-rail__error--after"
          >
            {errors.dropoff}
          </p>
        ) : null}
      </div>

      {hasRoute ? (
        <button
          type="button"
          className="route-rail__add"
          data-testid="route-add-stop"
          onClick={handleAddStop}
        >
          <span className="route-rail__add-icon" aria-hidden="true">
            <Plus className="size-3" />
          </span>
          {t("embeddable.add-a-stop")}
        </button>
      ) : null}
    </>
  );
}
