import { CalendarDays } from "lucide-react";

import { EmbeddableV4FieldError } from "@/features/booking/ui/embeddable/v4/embeddable-v4-field-error";

export function EmbeddableV4DateTimeField(props: {
  id: string;
  groupLabel: string;
  dateLabel: string;
  timeLabel: string;
  date: string;
  time: string;
  minDate: string;
  dateError?: string;
  timeError?: string;
  onDate: (value: string) => void;
  onTime: (value: string) => void;
  onDateBlur: () => void;
  onTimeBlur: () => void;
}) {
  const dateErrorId = `${props.id}-date-error`;
  const timeErrorId = `${props.id}-time-error`;
  const complete = Boolean(props.date && props.time && !props.dateError && !props.timeError);

  return (
    <div>
      <p id={`${props.id}-label`} className="v4-kicker">
        {props.groupLabel}
      </p>
      <div
        className="v4-field v4-datetime"
        data-complete={complete ? "true" : undefined}
        role="group"
        aria-labelledby={`${props.id}-label`}
      >
        <CalendarDays className="v4-icon size-4" aria-hidden="true" />
        <input
          id={`${props.id}-date`}
          name={`${props.id}-date`}
          type="date"
          autoComplete="off"
          aria-label={props.dateLabel}
          value={props.date}
          min={props.minDate}
          aria-invalid={props.dateError ? true : undefined}
          aria-describedby={props.dateError ? dateErrorId : undefined}
          onChange={(event) => props.onDate(event.target.value)}
          onBlur={props.onDateBlur}
        />
        <input
          id={`${props.id}-time`}
          name={`${props.id}-time`}
          type="time"
          autoComplete="off"
          aria-label={props.timeLabel}
          value={props.time}
          aria-invalid={props.timeError ? true : undefined}
          aria-describedby={props.timeError ? timeErrorId : undefined}
          onChange={(event) => props.onTime(event.target.value)}
          onBlur={props.onTimeBlur}
        />
      </div>
      <EmbeddableV4FieldError id={dateErrorId} message={props.dateError} />
      <EmbeddableV4FieldError id={timeErrorId} message={props.timeError} />
    </div>
  );
}
