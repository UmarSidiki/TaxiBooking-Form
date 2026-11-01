import { z } from "zod";
import { customerListQuerySchema } from "@/features/customers-admin/schema/customer-list.schema";

/**
 * The export accepts the same filters and sort as the list, without a cursor:
 * it always starts from the first row. A cursor sent by a client is stripped.
 */
export const customerExportQuerySchema = customerListQuerySchema.omit({
  cursor: true,
});

export type CustomerExportParams = z.infer<typeof customerExportQuerySchema>;
