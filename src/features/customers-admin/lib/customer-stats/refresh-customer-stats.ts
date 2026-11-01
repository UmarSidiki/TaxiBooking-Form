import { connectDB } from "@/shared/db";
import { getSettingsCurrency } from "@/features/booking/lib/get-settings-currency";
import {
  aggregateCustomerStats,
  statsEmailKey,
  toCustomerStatsRow,
} from "@/features/customers-admin/lib/customer-stats/aggregate-customer-stats";
import {
  deleteCustomerStats,
  findBookingsForEmail,
  loadProfilesFor,
  withProfileDefaults,
  writeCustomerStatsRows,
} from "@/features/customers-admin/lib/customer-stats/customer-stats.repo";

export type RefreshResult = {
  ok: boolean;
  action: "upserted" | "deleted" | "skipped" | "failed";
};

/**
 * Recompute one customer from their bookings. Idempotent: safe to call on every
 * create, patch, complete, or cancel instead of tracking deltas.
 */
export async function refreshCustomerStatsForEmail(
  emailRaw: string | null | undefined,
): Promise<RefreshResult> {
  const emailLower = statsEmailKey(emailRaw);
  if (!emailLower) return { ok: false, action: "skipped" };

  try {
    await connectDB();
    const [bookings, currency] = await Promise.all([
      findBookingsForEmail(emailLower),
      getSettingsCurrency(),
    ]);
    const [aggregate] = aggregateCustomerStats(bookings, currency).filter(
      (row) => row.emailLower === emailLower,
    );

    if (!aggregate) {
      await deleteCustomerStats(emailLower);
      return { ok: true, action: "deleted" };
    }

    const profiles = await loadProfilesFor([emailLower]);
    const row = withProfileDefaults(
      toCustomerStatsRow(aggregate),
      profiles.get(emailLower),
    );
    await writeCustomerStatsRows([row], new Date());
    return { ok: true, action: "upserted" };
  } catch (error) {
    console.error("CustomerStats refresh failed:", error);
    return { ok: false, action: "failed" };
  }
}

/** Fire-and-forget hook for paths where a stale read model must not block the flow. */
export function queueCustomerStatsRefresh(email: string | null | undefined): void {
  void refreshCustomerStatsForEmail(email);
}
