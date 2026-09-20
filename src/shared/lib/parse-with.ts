import type { z } from "zod";

export type ParseOk<T> = { ok: true; data: T };
export type ParseFail = { ok: false; error: "invalid_body" };

export function parseWith<S extends z.ZodType>(
  schema: S,
  data: unknown
): ParseOk<z.infer<S>> | ParseFail {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    return { ok: false, error: "invalid_body" };
  }
  return { ok: true, data: parsed.data };
}
