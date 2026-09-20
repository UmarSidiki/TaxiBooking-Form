import { NextResponse } from "next/server";
import { sendThankYouEmails } from "@/features/booking/lib/send-thank-you-emails";
import { cleanupAbandonedBookings } from "@/features/booking/lib/cleanup-abandoned-bookings";
import { deleteSuspendedPartners } from "@/features/partners/lib/delete-suspended-partners";
import { deleteOldCompletedRides } from "@/features/rides/lib/delete-old-completed-rides";

export async function GET() {
  console.log('🕒 Cron job triggered');

  // Send thank you emails
  console.log('📧 Sending thank you emails...');
  const emailResult = await sendThankYouEmails();
  
  // Cleanup abandoned bookings
  console.log('🧹 Cleaning up abandoned bookings...');
  const cleanupResult = await cleanupAbandonedBookings();

  // Delete suspended partners (30 days after suspension)
  console.log('🗑️ Deleting suspended partners...');
  const partnerDeletionResult = await deleteSuspendedPartners();

  // Delete old completed rides (90+ days old)
  console.log('🗑️ Deleting old completed rides...');
  const oldRidesDeletionResult = await deleteOldCompletedRides();

  const results = {
    success: emailResult.success && cleanupResult.success && partnerDeletionResult.success && oldRidesDeletionResult.success,
    emails: emailResult,
    cleanup: cleanupResult,
    partnerDeletion: partnerDeletionResult,
    oldRidesDeletion: oldRidesDeletionResult
  };

  if (results.success) {
    console.log('✅ Cron job completed successfully');
    return NextResponse.json(results);
  } else {
    console.error('❌ Cron job completed with errors');
    return NextResponse.json(results, { status: 500 });
  }
}