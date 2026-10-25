import { NextResponse } from "next/server";
import { connectDB } from "@/shared/db";
import { Booking } from "@/features/booking/model";
import CalendarFeed from "@/features/calendar/model/CalendarFeed";
import { buildIcs } from "@/features/calendar/lib/build-ics";
import DriverTimeOff from "@/features/drivers/model/DriverTimeOff";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const raw = (await params).token.replace(/\.ics$/, "");
  await connectDB();
  const feed = await CalendarFeed.findOne({ token: raw, revokedAt: { $exists: false } }).lean();
  if (!feed) {
    return new NextResponse("Not found", { status: 404 });
  }

  const query: Record<string, unknown> = { status: { $in: ["upcoming", "completed"] } };
  if (feed.role === "driver") query["assignedDriver._id"] = feed.ownerId;
  if (feed.role === "partner") query["assignedPartner._id"] = feed.ownerId;

  const rides = await Booking.find(query)
    .select("tripId date time pickup bookingType duration tripType")
    .sort({ date: 1, time: 1 })
    .limit(500)
    .lean();

  let ics = buildIcs(rides);
  if (feed.role === "driver") {
    const offs = await DriverTimeOff.find({ driverId: feed.ownerId }).limit(100).lean();
    if (offs.length) {
      const extra = offs.map((off) =>
        [
          "BEGIN:VEVENT",
          `UID:off-${String(off._id)}@taxi-booking`,
          `DTSTART:${new Date(off.startsAt).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")}`,
          `DTEND:${new Date(off.endsAt).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")}`,
          "SUMMARY:Time off",
          "END:VEVENT",
        ].join("\r\n"),
      );
      ics = ics.replace("END:VCALENDAR", `${extra.join("\r\n")}\r\nEND:VCALENDAR`);
    }
  }

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "private, max-age=300",
    },
  });
}
