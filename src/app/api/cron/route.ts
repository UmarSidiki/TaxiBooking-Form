import { NextRequest, NextResponse } from "next/server";
import { sendThankYouEmails } from "@/utils/sendThankYouEmails";

export async function GET(request: NextRequest) {
  // Check authorization
  const authHeader = request.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('🕒 Cron job triggered: Sending thank you emails');

  const result = await sendThankYouEmails();

  if (result.success) {
    console.log('✅ Cron job completed:', result.message);
    return NextResponse.json(result);
  } else {
    console.error('❌ Cron job failed:', result.message);
    return NextResponse.json(result, { status: 500 });
  }
}