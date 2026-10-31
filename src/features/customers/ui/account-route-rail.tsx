export function AccountRouteRail({
  pickup,
  dropoff,
  pickupLabel,
  dropoffLabel,
  pickupTime,
  dropoffTime,
}: {
  pickup: string;
  dropoff?: string;
  pickupLabel: string;
  dropoffLabel: string;
  pickupTime?: string;
  dropoffTime?: string;
}) {
  return (
    <div className="mt-[18px] border-t border-[var(--rule)] pt-[18px]">
      <Stop
        title={pickup}
        label={pickupLabel}
        time={pickupTime}
        kind="start"
        last={!dropoff}
      />
      {dropoff ? (
        <Stop
          title={dropoff}
          label={dropoffLabel}
          time={dropoffTime}
          kind="end"
          last
        />
      ) : null}
    </div>
  );
}

function Stop({
  title,
  label,
  time,
  kind,
  last,
}: {
  title: string;
  label: string;
  time?: string;
  kind: "start" | "end";
  last: boolean;
}) {
  return (
    <div className="relative grid grid-cols-[16px_minmax(0,1fr)_auto] gap-3 pb-[18px] last:pb-0">
      <span className="relative flex justify-center pt-[3px]" aria-hidden="true">
        {last ? null : (
          <span className="absolute bottom-[-21px] left-1/2 top-[17px] w-0.5 -translate-x-1/2 bg-[var(--rule2)]" />
        )}
        {kind === "start" ? (
          <span className="relative z-[1] size-3 rounded-full border-2 border-[var(--ink)] bg-[var(--sheet)]" />
        ) : (
          <span className="relative z-[1] mt-px size-2.5 rounded-[2px] bg-[var(--ink)]" />
        )}
      </span>
      <span className="min-w-0">
        <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--ink2)]">
          {label}
        </span>
        <b className="block break-words text-[13.5px] font-medium leading-[1.35]">
          {title}
        </b>
      </span>
      {time ? (
        <span className="hidden pt-[15px] text-xs tabular-nums text-[var(--ink2)] md:block">
          {time}
        </span>
      ) : null}
    </div>
  );
}
