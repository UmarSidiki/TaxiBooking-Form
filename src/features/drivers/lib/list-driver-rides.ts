import { Booking } from "@/features/booking/model";
import {
  DRIVER_RIDE_FIELDS,
  DRIVER_RIDE_PAGE_SIZE,
  type DriverRidesQuery,
} from "@/features/drivers/schema/driver-rides-query.schema";

export type DriverRideCursor = {
  date: string;
  time: string;
  id: string;
};

type RideRow = {
  _id: { toString(): string };
  date: string;
  time: string;
  email?: string;
  phone?: string;
  stripePaymentIntentId?: string;
  paymentTokenHash?: string;
};

export async function listDriverRides(driverId: string, query: DriverRidesQuery) {
  const limit = query.limit ?? DRIVER_RIDE_PAGE_SIZE;
  const clauses: Record<string, unknown>[] = [
    { "assignedDriver._id": driverId },
    { status: { $in: ["upcoming", "completed"] } },
  ];

  if (query.from || query.to) {
    const date: Record<string, string> = {};
    if (query.from) date.$gte = query.from;
    if (query.to) date.$lte = query.to;
    clauses.push({ date });
  }

  if (query.afterDate && query.afterTime && query.afterId) {
    clauses.push({
      $or: [
        { date: { $gt: query.afterDate } },
        { date: query.afterDate, time: { $gt: query.afterTime } },
        {
          date: query.afterDate,
          time: query.afterTime,
          _id: { $gt: query.afterId },
        },
      ],
    });
  }

  const rows = await Booking.find({ $and: clauses })
    .sort({ date: 1, time: 1, _id: 1 })
    .select(DRIVER_RIDE_FIELDS)
    .limit(limit + 1)
    .lean<RideRow[]>();

  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;
  const last = data[data.length - 1];
  const nextCursor: DriverRideCursor | null =
    hasMore && last
      ? { date: last.date, time: last.time, id: String(last._id) }
      : null;

  return { data, hasMore, nextCursor };
}
