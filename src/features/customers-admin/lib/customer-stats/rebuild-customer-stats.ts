import { connectDB } from "@/shared/db";
import { getSettingsCurrency } from "@/features/booking/lib/get-settings-currency";
import {
  aggregateCustomerStats,
  mergeCustomerStats,
  toCustomerStatsRow,
} from "@/features/customers-admin/lib/customer-stats/aggregate-customer-stats";
import {
  deleteStaleCustomerStats,
  loadBookingChunk,
  loadProfilesFor,
  withProfileDefaults,
  writeCustomerStatsRows,
} from "@/features/customers-admin/lib/customer-stats/customer-stats.repo";
import type {
  CustomerStatsAggregate,
  CustomerStatsRow,
} from "@/features/customers-admin/lib/customer-stats/customer-stats.types";

export type RebuildResult = {
  dryRun: boolean;
  chunks: number;
  emails: number;
  rowsWritten: number;
  staleRemoved: number;
};

export type RebuildOptions = {
  dryRun?: boolean;
  chunkSize?: number;
  profileBatchSize?: number;
};

/**
 * Full rebuild: key-set pages over Booking, one row per email, plus pruning of
 * customers whose rides disappeared. Runs once per UTC day from /api/cron.
 */
export async function rebuildCustomerStats(
  options: RebuildOptions = {},
): Promise<RebuildResult> {
  const dryRun = options.dryRun ?? false;
  const chunkSize = options.chunkSize ?? 500;
  const profileBatchSize = options.profileBatchSize ?? 500;
  const startedAt = new Date();

  await connectDB();
  const currency = await getSettingsCurrency();
  const rows = new Map<string, CustomerStatsAggregate>();

  let chunks = 0;
  let afterId: string | null = null;
  for (;;) {
    const chunk = await loadBookingChunk(afterId, chunkSize);
    chunks += 1;
    mergeCustomerStats(rows, aggregateCustomerStats(chunk, currency));
    if (chunk.length < chunkSize) break;
    const last = chunk[chunk.length - 1];
    afterId = String(last._id);
  }

  const aggregates = [...rows.values()].sort((a, b) =>
    a.emailLower.localeCompare(b.emailLower),
  );

  if (dryRun) {
    return {
      dryRun,
      chunks,
      emails: aggregates.length,
      rowsWritten: 0,
      staleRemoved: 0,
    };
  }

  const enriched: CustomerStatsRow[] = [];
  for (let index = 0; index < aggregates.length; index += profileBatchSize) {
    const batch = aggregates.slice(index, index + profileBatchSize);
    const profiles = await loadProfilesFor(batch.map((row) => row.emailLower));
    enriched.push(
      ...batch.map((row) =>
        withProfileDefaults(toCustomerStatsRow(row), profiles.get(row.emailLower)),
      ),
    );
  }

  const rowsWritten = await writeCustomerStatsRows(enriched, startedAt);
  const staleRemoved = await deleteStaleCustomerStats(startedAt);

  return { dryRun, chunks, emails: aggregates.length, rowsWritten, staleRemoved };
}
