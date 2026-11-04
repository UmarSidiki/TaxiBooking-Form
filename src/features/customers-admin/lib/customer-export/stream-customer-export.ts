import {
  recordAdminAudit,
  type AdminAuditActor,
} from "@/features/customers-admin/lib/audit/record-admin-audit";
import {
  customerExportHeaderLine,
  customerExportLine,
} from "@/features/customers-admin/lib/customer-export/customer-export-row";
import { iterateCustomerExportRows } from "@/features/customers-admin/lib/customer-export/customer-export-rows";
import type { CustomerListParams } from "@/features/customers-admin/schema/customer-list.schema";

const UTF8_BOM = "\uFEFF";
const CHUNK_ROWS = 200;
const FILTER_METADATA_LIMIT = 900;

export type CustomerExportInput = {
  params: CustomerListParams;
  actor: AdminAuditActor;
  request?: Request;
};

function filterSummary(params: CustomerListParams): string {
  const summary = JSON.stringify(params);
  return summary.length > FILTER_METADATA_LIMIT
    ? `${summary.slice(0, FILTER_METADATA_LIMIT)}…`
    : summary;
}

/**
 * Streams the filtered customer list as UTF-8 CSV with a BOM for Excel.
 * The audit entry (who, filters, row count) is written when the stream ends,
 * including when a client aborts: cancellation runs the same finaliser.
 */
export function buildCustomerExportStream(
  input: CustomerExportInput,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const rows = iterateCustomerExportRows(input.params);
  let rowCount = 0;
  let finished = false;
  let headerSent = false;

  async function finish(): Promise<void> {
    if (finished) return;
    finished = true;
    try {
      await recordAdminAudit({
        actor: input.actor,
        action: "csv.export",
        targetType: "export",
        targetId: "customers.csv",
        metadata: {
          rowCount,
          filters: filterSummary(input.params),
        },
        request: input.request,
      });
    } catch (error) {
      console.error("Customer export audit failed:", error);
    }
  }

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const parts: string[] = [];
        if (!headerSent) {
          parts.push(UTF8_BOM, customerExportHeaderLine());
          headerSent = true;
        }

        let done = false;
        for (let index = 0; index < CHUNK_ROWS; index += 1) {
          const next = await rows.next();
          if (next.done) {
            done = true;
            break;
          }
          rowCount += 1;
          parts.push(customerExportLine(next.value));
        }

        if (parts.length > 0) controller.enqueue(encoder.encode(parts.join("")));
        if (done) {
          await finish();
          controller.close();
        }
      } catch (error) {
        await finish();
        controller.error(error);
      }
    },
    async cancel() {
      await rows.return(undefined);
      await finish();
    },
  });
}
