import { memoryLimit } from "@/shared/http/memory-limit";
import { mongoWindowLimit } from "@/shared/http/rate-window";
import { clientIp } from "@/shared/http/client-ip";

/** Sign-in attempts allowed per account + IP inside the window. */
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 5 * 60_000;

type AuthRequest = { headers?: Headers } | undefined;

function ipOf(request: AuthRequest) {
  if (!request?.headers) return "unknown";
  return clientIp({ headers: request.headers } as Request);
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
