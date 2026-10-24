import { NextResponse } from "next/server";
import { sendThankYouEmails } from "@/features/booking/lib/send-thank-you-emails";
import { cleanupAbandonedBookings } from "@/features/booking/lib/cleanup-abandoned-bookings";
import { deleteSuspendedPartners } from "@/features/partners/lib/delete-suspended-partners";
import { deleteOldCompletedRides } from "@/features/rides/lib/delete-old-completed-rides";
import { isCronAuthorized } from "@/shared/http/is-cron-authorized";

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!isCronAuthorized(req.headers.get("authorization"), cronSecret)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  console.log("🕒 Cron job triggered");

  const [emailResult, cleanupResult, partnerDeletionResult, oldRidesDeletionResult] =
    await Promise.all([
      sendThankYouEmails(),
      cleanupAbandonedBookings(),
      deleteSuspendedPartners(),
      deleteOldCompletedRides(),
    ]);

  const results = {
    success:
      emailResult.success &&
      cleanupResult.success &&
      partnerDeletionResult.success &&
      oldRidesDeletionResult.success,
    emails: emailResult,
    cleanup: cleanupResult,
    partnerDeletion: partnerDeletionResult,
    oldRidesDeletion: oldRidesDeletionResult,
  };

  if (results.success) {
    console.log("✅ Cron job completed successfully");
    return NextResponse.json(results);
  }

  console.error("❌ Cron job completed with errors");
  return NextResponse.json(results, { status: 500 });
}
