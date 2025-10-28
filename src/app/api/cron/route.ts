import { NextResponse } from "next/server";
import { sendThankYouEmails } from "@/utils/sendThankYouEmails";
import { cleanupAbandonedBookings } from "@/utils/cleanupAbandonedBookings";

export async function GET() {
  console.log('🕒 Cron job triggered');

  // Send thank you emails
  console.log('📧 Sending thank you emails...');
  const emailResult = await sendThankYouEmails();
  
  // Cleanup abandoned bookings
  console.log('🧹 Cleaning up abandoned bookings...');
  const cleanupResult = await cleanupAbandonedBookings();

  const results = {
    success: emailResult.success && cleanupResult.success,
    emails: emailResult,
    cleanup: cleanupResult
  };

  if (results.success) {
    console.log('✅ Cron job completed successfully');
    return NextResponse.json(results);
  } else {
    console.error('❌ Cron job completed with errors');
    return NextResponse.json(results, { status: 500 });
  }
}