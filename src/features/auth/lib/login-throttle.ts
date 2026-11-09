import { memoryLimit } from "@/shared/http/memory-limit";
import { mongoWindowLimit } from "@/shared/http/rate-window";

/** Sign-in attempts allowed per account + IP inside the window. */
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 5 * 60_000;

/**
 * NextAuth 4 hands the provider a plain header record, not a `Headers`
 * instance, so the forwarding headers are read without assuming `.get()`.
 */
type AuthHeaders = Headers | Record<string, string | string[] | undefined>;

type AuthRequest = { headers?: AuthHeaders } | undefined;

function headerValue(headers: AuthHeaders, name: string): string | null {
  const get = (headers as Headers).get;
  if (typeof get === "function") return get.call(headers, name);

  const record = headers as Record<string, string | string[] | undefined>;
  const value = record[name] ?? record[name.toLowerCase()];
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function ipOf(request: AuthRequest) {
  if (!request?.headers) return "unknown";

  const forwarded = headerValue(request.headers, "x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  if (first) return first;

  return headerValue(request.headers, "x-real-ip")?.trim() || "unknown";
}

/**
 * Throttles the credentials provider: without it an unlimited stream of
 * password guesses can be sent at a known operator email.
 */
export async function assertLoginAllowed(
  email: string,
  request: AuthRequest
): Promise<void> {
  const key = `login:${email.toLowerCase().trim()}:${ipOf(request)}`;

  const memory = memoryLimit(key, MAX_ATTEMPTS, WINDOW_MS);
  if (!memory.ok) {
    throw new Error("Too many sign-in attempts. Try again in a few minutes.");
  }

  const stored = await mongoWindowLimit(key, MAX_ATTEMPTS);
  if (!stored.ok) {
    throw new Error("Too many sign-in attempts. Try again in a few minutes.");
  }
}
