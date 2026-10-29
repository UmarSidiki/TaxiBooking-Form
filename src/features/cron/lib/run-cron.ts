import { claimDailyRun, unclaimDailyRun } from "@/features/cron/lib/daily-gate";
import { withCronLock } from "@/features/cron/lib/cron-lock";

type Counted = { success?: boolean; sent?: number };

export type CronBody =
  | { ok: true; skipped: "locked" }
  | {
      ok: boolean;
      hourly: { reminders: number; notifications: number; holidaysPruned: number; pendingSwept: number };
      daily: "skipped" | "ran" | "failed";
    };

async function runDaily() {
  const stamp = await claimDailyRun();
  if (!stamp) return "skipped" as const;
  const [{ cleanupAbandonedBookings }, { deleteSuspendedPartners }, { deleteOldCompletedRides }] =
    await Promise.all([
      import("@/features/booking/lib/cleanup-abandoned-bookings"),
      import("@/features/partners/lib/delete-suspended-partners"),
      import("@/features/rides/lib/delete-old-completed-rides"),
    ]);
  const [{ generateDueRecurring }, { sendQuoteFollowUps }] = await Promise.all([
    import("@/features/corporate/lib/generate-recurring"),
    import("@/features/corporate/lib/quote-follow-up"),
  ]);
  const expiry = await import("@/features/reports/lib/expiring-documents");
  const [cleanup, partners, oldRides, recurring, followUps, documents] = await Promise.all([
    cleanupAbandonedBookings(),
    deleteSuspendedPartners(),
    deleteOldCompletedRides(),
    generateDueRecurring(),
    sendQuoteFollowUps(),
    expiry.alertExpiringDocuments(),
  ]);
  if (!cleanup.success || !partners.success || !oldRides.success || !recurring.success || !followUps.success || !documents.success) {
    await unclaimDailyRun(stamp);
    return "failed" as const;
  }
  return "ran" as const;
}

/** Hourly reminders and notifications. Cleanup, deletions, and later daily jobs run once per UTC day. */
export async function runCron(): Promise<CronBody> {
  const held = await withCronLock(async () => {
    const [{ sendPickupReminders }, { sendThankYouEmails }, { pruneExpiredHolidays }, { sweepAbandonedPendingBookings }] = await Promise.all([
      import("@/features/booking/lib/send-pickup-reminders"),
      import("@/features/booking/lib/send-thank-you-emails"),
      import("@/features/pricing/lib/prune-holidays"),
      import("@/features/booking/lib/sweep-abandoned-pending-bookings"),
    ]);
    const [reminders, notifications, holidays, pending] = await Promise.all([
      sendPickupReminders() as Promise<Counted>,
      sendThankYouEmails() as Promise<Counted>,
      pruneExpiredHolidays().catch(() => 0),
      sweepAbandonedPendingBookings().catch(() => ({ success: false, count: 0 })),
    ]);
    const daily = await runDaily();
    return {
      ok: reminders.success !== false && notifications.success !== false && daily !== "failed",
      hourly: {
        reminders: reminders.sent ?? 0,
        notifications: notifications.sent ?? 0,
        holidaysPruned: holidays,
        pendingSwept: pending.count,
      },
      daily,
    };
  });
  if (!held.locked) return { ok: true, skipped: "locked" };
  return held.value;
}
