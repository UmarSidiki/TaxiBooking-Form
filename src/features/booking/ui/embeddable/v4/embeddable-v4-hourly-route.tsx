"use client";

import type { RefObject } from "react";
import type { useTranslations } from "next-intl";

import { EmbeddableV4RouteRow } from "@/features/booking/ui/embeddable/v4/embeddable-v4-route-row";

type TFn = ReturnType<typeof useTranslations>;

export function EmbeddableV4HourlyRoute({
  t,
  placeholder,
  pickup,
  duration,
  pickupError,
  pickupInputRef,
  onInput,
  onBlur,
}: {
  t: TFn;
  placeholder: string;
  pickup: string;
  duration: number;
  pickupError?: string;
  pickupInputRef: RefObject<HTMLInputElement | null>;
  onInput: (field: string, value: string | number) => void;
  onBlur: (field: string) => void;
}) {
  return (
    <div className="v4-journey">
      <div className="v4-stops v4-stops-plain">
        <EmbeddableV4RouteRow
          id="v4-pickup"
          prefix={t("embeddable.from-prefix")}
          placeholder={placeholder}
          value={pickup}
          marker="start"
          error={pickupError}
          inputRef={pickupInputRef}
          onChange={(value) => onInput("pickup", value)}
          onBlur={() => onBlur("pickup")}
        />
      </div>
      <div>
        <label className="v4-kicker" htmlFor="v4-duration">
          {t("embeddable.duration-hours")}
        </label>
        <div className="v4-field">
          <input
            id="v4-duration"
            name="duration"
            type="number"
            inputMode="numeric"
            autoComplete="off"
            min={1}
            value={duration}
            onChange={(event) => onInput("duration", Math.max(1, Number(event.target.value) || 1))}
          />
        </div>
      </div>
    </div>
  );
}
