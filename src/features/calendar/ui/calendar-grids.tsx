"use client";

type Ride = {
  _id: string;
  date: string;
  time: string;
  pickup: string;
};

function localStamp(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function startOfWeek(anchor: Date) {
  const date = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
  const mondayOffset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - mondayOffset);
  return date;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 16 }, (_, index) => index + 6);

export function CalendarMonthGrid({ rides, label }: { rides: Ride[]; label: string }) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const first = new Date(year, month, 1);
  const pad = (first.getDay() + 6) % 7;
  const count = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(pad).fill(null), ...Array.from({ length: count }, (_, index) => index + 1)];

  return (
    <div role="grid" aria-label={label} className="grid grid-cols-7 gap-px overflow-hidden rounded-md border border-border bg-border">
      {WEEKDAYS.map((day) => (
        <div key={day} role="columnheader" className="bg-muted px-2 py-2 text-xs font-medium">
          {day}
        </div>
      ))}
      {cells.map((day, index) => {
        const stamp = typeof day === "number" ? localStamp(year, month, day) : "";
        const items = rides.filter((ride) => ride.date === stamp);
        return (
          <div key={stamp || `empty-${index}`} role="gridcell" className="min-h-24 bg-card p-1">
            <p className="text-xs text-muted-foreground">{day ?? ""}</p>
            {items.map((ride) => (
              <p key={ride._id} className="truncate text-xs font-medium">
                {ride.time} {ride.pickup}
              </p>
            ))}
          </div>
        );
      })}
    </div>
  );
}

export function CalendarTimeGrid({
  rides,
  label,
  days,
}: {
  rides: Ride[];
  label: string;
  days: number;
}) {
  const start = days === 1 ? new Date() : startOfWeek(new Date());
  const columns = Array.from({ length: days }, (_, index) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + (days === 1 ? 0 : index));
    return localStamp(date.getFullYear(), date.getMonth(), date.getDate());
  });

  return (
    <div role="grid" aria-label={label} className="overflow-x-auto rounded-md border border-border">
      <div
        className="grid min-w-[40rem]"
        style={{ gridTemplateColumns: `4rem repeat(${days}, minmax(0, 1fr))` }}
      >
        <div className="bg-muted" />
        {columns.map((stamp) => (
          <div key={stamp} role="columnheader" className="border-s border-border bg-muted px-2 py-2 text-xs font-medium">
            {stamp.slice(5)}
          </div>
        ))}
        {HOURS.map((hour) => (
          <HourRow key={hour} hour={hour} columns={columns} rides={rides} />
        ))}
      </div>
    </div>
  );
}

function HourRow({
  hour,
  columns,
  rides,
}: {
  hour: number;
  columns: string[];
  rides: Ride[];
}) {
  const label = `${String(hour).padStart(2, "0")}:00`;
  return (
    <>
      <div className="border-t border-border px-2 py-2 text-xs text-muted-foreground">{label}</div>
      {columns.map((stamp) => {
        const items = rides.filter((ride) => ride.date === stamp && Number(ride.time.slice(0, 2)) === hour);
        return (
          <div key={`${stamp}-${hour}`} role="gridcell" className="min-h-11 border-s border-t border-border p-1">
            {items.map((ride) => (
              <p key={ride._id} className="truncate text-xs font-medium">
                {ride.time} {ride.pickup}
              </p>
            ))}
          </div>
        );
      })}
    </>
  );
}
