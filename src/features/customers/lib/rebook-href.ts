export type RebookSource = {
  pickup?: string;
  dropoff?: string;
  date?: string;
  time?: string;
  passengers?: number;
  bookingType?: string;
  duration?: number;
};

/** Reopen the booking form pre-filled with a previous ride. */
export function rebookHref(ride: RebookSource, locale: string): string {
  const params = new URLSearchParams();
  if (ride.pickup) params.set("pickup", ride.pickup);
  if (ride.dropoff) params.set("dropoff", ride.dropoff);
  if (ride.date) params.set("date", ride.date);
  if (ride.time) params.set("time", ride.time);
  if (ride.passengers) params.set("passengers", String(ride.passengers));
  if (ride.bookingType) params.set("bookingType", ride.bookingType);
  if (ride.duration) params.set("duration", String(ride.duration));
  const query = params.toString();
  return query ? `/${locale}?${query}` : `/${locale}`;
}
