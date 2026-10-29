import { z } from "zod";

const idempotencyKeySchema = z.string().uuid();

/** Reads the client `Idempotency-Key` header (the checkout draft id). */
export function readIdempotencyKey(request: Request): string | undefined {
  const value = request.headers.get("idempotency-key")?.trim();
  if (!value) return undefined;
  const parsed = idempotencyKeySchema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
}
