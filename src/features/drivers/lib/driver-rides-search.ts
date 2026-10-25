import { DRIVER_RIDE_PAGE_SIZE } from "@/features/drivers/schema/driver-rides-query.schema";

export type DriverRideCursor = {
  date: string;
  time: string;
  id: string;
};

function isoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Date window for one driver-desk page. A picked range replaces the tab default. */
export function driverRidesSearch(input: {
  activeTab: string;
  rangeFrom?: Date;
  rangeTo?: Date;
  cursor?: DriverRideCursor | null;
  today?: Date;
}) {
  const today = input.today ?? new Date();
  const params = new URLSearchParams();
  params.set("limit", String(DRIVER_RIDE_PAGE_SIZE));

  if (input.rangeFrom) params.set("from", isoDate(input.rangeFrom));
  else if (input.activeTab === "passed") params.set("from", isoDate(addDays(today, -120)));
  else if (input.activeTab !== "canceled") params.set("from", isoDate(today));

  if (input.rangeTo) params.set("to", isoDate(input.rangeTo));
  else if (input.activeTab === "passed" || input.activeTab === "canceled") {
    params.set("to", isoDate(today));
  }

  if (input.cursor) {
    params.set("afterDate", input.cursor.date);
    params.set("afterTime", input.cursor.time);
    params.set("afterId", input.cursor.id);
  }

  return params.toString();
}
