import { z } from "zod";
import {
  customerSortDirectionSchema,
  customerSortSchema,
  type CustomerSort,
  type CustomerSortDirection,
} from "@/features/customers-admin/schema/customer-list.schema";
import type { CustomerListSortSpec } from "@/features/customers-admin/lib/customer-list/customer-list.types";

const cursorPayloadSchema = z.object({
  s: customerSortSchema,
  d: customerSortDirectionSchema,
  v: z.union([z.string(), z.number(), z.null()]),
  e: z.string().min(1).max(320),
});

export type CustomerListCursor = {
  value: string | number | Date | null;
  emailLower: string;
};

export function encodeCustomerListCursor(
  spec: CustomerListSortSpec,
  value: string | number | Date | null,
  emailLower: string,
): string {
  const payload = {
    s: spec.sort,
    d: spec.direction,
    v: value instanceof Date ? value.toISOString() : value,
    e: emailLower,
  };
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodeValue(
  raw: string | number | null,
  spec: CustomerListSortSpec,
): string | number | Date | null | undefined {
  if (raw === null) return spec.kind === "date-null" ? null : undefined;
  if (spec.kind === "number") {
    return typeof raw === "number" && Number.isFinite(raw) ? raw : undefined;
  }
  if (typeof raw !== "string") return undefined;
  if (spec.kind === "string") return raw;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function decodeCustomerListCursor(
  raw: string,
  spec: CustomerListSortSpec,
  sort: CustomerSort,
  direction: CustomerSortDirection,
): CustomerListCursor | null {
  try {
    const parsed = cursorPayloadSchema.safeParse(
      JSON.parse(Buffer.from(raw, "base64url").toString("utf8")),
    );
    if (!parsed.success) return null;
    if (parsed.data.s !== sort || parsed.data.d !== direction) return null;
    const value = decodeValue(parsed.data.v, spec);
    if (value === undefined) return null;
    return { value, emailLower: parsed.data.e };
  } catch {
    return null;
  }
}
