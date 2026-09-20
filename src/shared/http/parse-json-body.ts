import type { z } from "zod";
import { jsonError } from "@/shared/http/json-error";
import { parseWith } from "@/shared/lib/parse-with";

export async function parseJsonBody<S extends z.ZodType>(
  request: Request,
  schema: S
): Promise<
  | { ok: true; data: z.infer<S> }
  | { ok: false; response: ReturnType<typeof jsonError> }
> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { ok: false, response: jsonError("invalid_body", 400) };
  }

  const parsed = parseWith(schema, raw);
  if (!parsed.ok) {
    return { ok: false, response: jsonError(parsed.error, 400) };
  }

  return parsed;
}
