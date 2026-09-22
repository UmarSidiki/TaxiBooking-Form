"use client";

import { CalendarDays, Minus, Plus } from "lucide-react";
import type { ReactNode } from "react";
import type { useTranslations } from "next-intl";

import type { FormData, FormErrors } from "@/features/booking/context/booking-form-context";
import { MAX_PASSENGERS, MIN_PASSENGERS } from "@/features/booking/lib/passenger-limits";
import { EmbeddableV4DateTimeField } from "@/features/booking/ui/embeddable/v4/embeddable-v4-date-time-field";
import { Switch } from "@/shared/ui/switch";

type TFn = ReturnType<typeof useTranslations>;

export function EmbeddableV4JourneyFields({
  t,
  formData,
  errors,
  minDate,
  onInput,
  onBlur,
  onTripType,
}: {
  t: TFn;
  formData: FormData;
  errors: FormErrors;
  minDate: string;
  onInput: (field: string, value: string | number) => void;
  onBlur: (field: string) => void;
  onTripType: (type: FormData["tripType"]) => void;
}) {
  const updatePassengers = (next: number) => {
    onInput("passengers", Math.min(MAX_PASSENGERS, Math.max(MIN_PASSENGERS, next)));
  };
  const isHourly = formData.bookingType === "hourly";
  const isReturn = formData.tripType === "roundtrip";

  return (
    <section className="v4-journey" aria-label={t("embeddable.pickup-moment")}>
      <EmbeddableV4DateTimeField
        id="v4-departure"
        groupLabel={t("embeddable.pickup-moment")}
        dateLabel={t("embeddable.departure-date")}
        timeLabel={t("embeddable.departure-time")}
        date={formData.date}
        time={formData.time}
        minDate={minDate}
        dateError={errors.date}
        timeError={errors.time}
        onDate={(value) => onInput("date", value)}
        onTime={(value) => onInput("time", value)}
        onDateBlur={() => onBlur("date")}
        onTimeBlur={() => onBlur("time")}
      />

      {isHourly ? null : (
        <>
          <div className="v4-return">
            <Switch
              id="v4-roundtrip"
              checked={isReturn}
              onCheckedChange={(checked) => onTripType(checked ? "roundtrip" : "oneway")}
            />
            <label htmlFor="v4-roundtrip">{t("embeddable.round-trip")}</label>
          </div>
          {isReturn ? (
            <EmbeddableV4DateTimeField
              id="v4-return"
              groupLabel={t("embeddable.return-date")}
              dateLabel={t("embeddable.return-date")}
              timeLabel={t("embeddable.return-time")}
              date={formData.returnDate}
              time={formData.returnTime}
              minDate={formData.date || minDate}
              dateError={errors.returnDate}
              timeError={errors.returnTime}
              onDate={(value) => onInput("returnDate", value)}
              onTime={(value) => onInput("returnTime", value)}
              onDateBlur={() => onBlur("returnDate")}
              onTimeBlur={() => onBlur("returnTime")}
            />
          ) : (
            <div className="v4-field v4-field-quiet">
              <CalendarDays className="v4-icon size-4" aria-hidden="true" />
              <span>{t("embeddable.one-way")}</span>
            </div>
          )}
        </>
      )}

      <div>
        <p className="v4-kicker" id="v4-passengers-label">
          {t("embeddable.passengers")}
        </p>
        <div className="v4-stepper" role="group" aria-labelledby="v4-passengers-label">
          <StepButton
            label={t("embeddable.decrease-passengers")}
            disabled={formData.passengers <= MIN_PASSENGERS}
            onClick={() => updatePassengers(formData.passengers - 1)}
          >
            <Minus className="size-4" aria-hidden="true" />
          </StepButton>
          <output aria-live="polite">{formData.passengers}</output>
          <StepButton
            label={t("embeddable.increase-passengers")}
            disabled={formData.passengers >= MAX_PASSENGERS}
            onClick={() => updatePassengers(formData.passengers + 1)}
          >
            <Plus className="size-4" aria-hidden="true" />
          </StepButton>
        </div>
      </div>
    </section>
  );
}

function StepButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button type="button" aria-label={label} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}
