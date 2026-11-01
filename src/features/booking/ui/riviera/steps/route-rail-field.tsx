"use client";

import { X } from "lucide-react";
import type { ReactNode, Ref } from "react";

import { addressInputProps } from "@/features/booking/lib/maps/place-autocomplete";
import { PickupCurrentLocationButton } from "@/features/booking/ui/steps/pickup-current-location-button";

type Props = {
  id: string;
  marker?: ReactNode;
  label: string;
  value: string;
  placeholder: string;
  inputRef?: Ref<HTMLInputElement>;
  locate?: boolean;
  invalid?: boolean;
  errorId?: string;
  removeLabel?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onRemove?: () => void;
};

export function RouteRailField({
  id,
  marker,
  label,
  value,
  placeholder,
  inputRef,
  locate,
  invalid,
  errorId,
  removeLabel,
  onChange,
  onBlur,
  onRemove,
}: Props) {
  const modifier = locate
    ? " route-rail__field--locate"
    : onRemove
      ? " route-rail__field--stop"
      : "";

  return (
    <div className={`route-rail__field${modifier}`}>
      {marker}
      <label className="route-rail__label" htmlFor={id}>
        {label}
      </label>
      <input
        {...addressInputProps}
        id={id}
        ref={inputRef}
        className="route-rail__input"
        placeholder={placeholder}
        value={value}
        aria-invalid={invalid ? true : undefined}
        aria-describedby={invalid && errorId ? errorId : undefined}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
      />
      {locate ? <PickupCurrentLocationButton /> : null}
      {onRemove && removeLabel ? (
        <button
          type="button"
          className="route-rail__remove"
          data-testid="route-remove-stop"
          aria-label={removeLabel}
          onClick={onRemove}
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
