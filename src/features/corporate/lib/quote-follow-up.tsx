import { Booking } from "@/features/booking/model";
import { resolvePublicUrl } from "@/features/settings/lib/public-url";
import { customerPortalUrl } from "@/features/customers/lib/customer-token";
import { prepareEventEmail, sendPreparedEmail } from "@/features/emails/lib/send-event-email";
import { NoticeEmail } from "@/features/emails/templates/notice-email";

export async function sendQuoteFollowUps(now = new Date()) {
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const rows = await Booking.find({
    status: "awaiting_payment",
    quoteFollowUpSent: { $ne: true },
    createdAt: { $lte: cutoff },
  })
    .select("tripId email pickup date time locale")
    .limit(30);

  const base = await resolvePublicUrl().catch(() => null);
  let sent = 0;

  for (const ride of rows) {
    const claimed = await Booking.findOneAndUpdate(
      { _id: ride._id, quoteFollowUpSent: { $ne: true } },
      { $set: { quoteFollowUpSent: true } },
    );
    if (!claimed) continue;

    const prepared = await prepareEventEmail({
      event: "quote_follow_up",
      audience: "customer",
      locale: "en",
      values: {
        tripId: ride.tripId,
        pickup: ride.pickup,
        date: ride.date,
        time: ride.time,
      },
    });
    if (!prepared) continue;

    const manageUrl = customerPortalUrl(base, prepared.locale, ride.email);
    await sendPreparedEmail({
      prepared,
      to: ride.email,
      element: (
        <NoticeEmail
          t={prepared.t}
          brand={prepared.brand}
          locale={prepared.locale}
          subject={prepared.copy.subject}
          intro={prepared.copy.intro}
          status={{ label: prepared.t("status_pending"), tone: "warning" }}
          trip={{
            tripId: ride.tripId,
            pickup: ride.pickup,
            date: ride.date,
            time: ride.time,
          }}
          manageUrl={manageUrl}
        />
      ),
      links: [manageUrl],
    });
    sent += 1;
  }

  return { success: true, sent };
}
