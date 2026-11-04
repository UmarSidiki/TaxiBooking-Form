import { claimDailyRun, unclaimDailyRun } from "@/features/cron/lib/daily-gate";
import { withCronLock } from "@/features/cron/lib/cron-lock";

type Counted = { success?: boolean; sent?: number };
type DailyRun = { state: "skipped" | "ran" | "failed"; statsRebuilt: number };

export type CronBody =
  | { ok: true; skipped: "locked" }
  | {
      ok: boolean;
      hourly: {
        reminders: number;
        notifications: number;
        holidaysPruned: number;
        pendingSwept: number;
        statsRebuilt: number;
      };
      daily: DailyRun["state"];
  campaigns?: unknown;
    };

/** Nightly read-model rebuild, exposed so the /api/cron daily pass can call it. */
export async function runNightlyCustomerStats(): Promise<number> {
  const { rebuildCustomerStats } = await import(
    "@/features/customers-admin/lib/customer-stats/rebuild-customer-stats"
  );
  const result = await rebuildCustomerStats();
  return result.rowsWritten;
}

async function runDaily(): Promise<DailyRun> {
  const stamp = await claimDailyRun();
  if (!stamp) return { state: "skipped", statsRebuilt: 0 };
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
    return { state: "failed", statsRebuilt: 0 };
  }

  let statsRebuilt = 0;
  try {
    statsRebuilt = await runNightlyCustomerStats();
  } catch (error) {
    console.error("CustomerStats rebuild failed:", error);
    await unclaimDailyRun(stamp);
    return { state: "failed", statsRebuilt: 0 };
  }
  return { state: "ran", statsRebuilt };
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
    const campaigns = await (await import("@/features/marketing/lib/campaigns/run-campaign-tick")).runCampaignTick();
    return {
      ok: reminders.success !== false && notifications.success !== false && daily.state !== "failed",
      hourly: {
        reminders: reminders.sent ?? 0,
        notifications: notifications.sent ?? 0,
        holidaysPruned: holidays,
        pendingSwept: pending.count,
        statsRebuilt: daily.statsRebuilt,
      },
      daily: daily.state,
      campaigns,
    };
  });
  if (!held.locked) return { ok: true, skipped: "locked" };
  return held.value;
}
