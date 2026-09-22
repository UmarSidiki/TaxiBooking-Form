import { X } from "lucide-react";
import type { Ref } from "react";

import { EmbeddableV4FieldError } from "@/features/booking/ui/embeddable/v4/embeddable-v4-field-error";

type Marker = "start" | "via" | "end" | "none";

export function EmbeddableV4RouteRow({
  id,
  prefix,
  placeholder,
  value,
  marker,
  error,
  inputRef,
  removeLabel,
  onChange,
  onBlur,
  onRemove,
}: {
  id: string;
  prefix: string;
  placeholder: string;
  value: string;
  marker: Marker;
  error?: string;
  inputRef?: Ref<HTMLInputElement>;
  removeLabel?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onRemove?: () => void;
}) {
  const errorId = `${id}-error`;

  return (
    <div className="v4-stop">
      <span className="v4-mark" aria-hidden="true">
        <RouteMark marker={marker} />
      </span>
      <div className="min-w-0">
        <div className="v4-field">
          <label className="v4-prefix" htmlFor={id}>
            {prefix}
          </label>
          <input
            ref={inputRef}
            id={id}
            name={id}
            autoComplete="off"
            spellCheck={false}
            placeholder={placeholder}
            value={value}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            onChange={(event) => onChange(event.target.value)}
            onBlur={onBlur}
          />
          {onRemove && removeLabel ? (
            <button type="button" className="v4-remove" aria-label={removeLabel} onClick={onRemove}>
              <X className="size-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>
        <EmbeddableV4FieldError id={errorId} message={error} />
      </div>
    </div>
  );
}

function RouteMark({ marker }: { marker: Marker }) {
  if (marker === "none") return null;
  if (marker === "end") {
    return (
      <svg className="v4-pin" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 2.2a6.3 6.3 0 0 0-6.5 6.3c0 4.7 6.5 13.3 6.5 13.3s6.5-8.6 6.5-13.3A6.3 6.3 0 0 0 12 2.2zm0 8.6a2.3 2.3 0 1 1 0-4.6 2.3 2.3 0 0 1 0 4.6z"
        />
      </svg>
    );
  }
  return <span className={marker === "start" ? "v4-dot v4-dot-start" : "v4-dot"} />;
}
