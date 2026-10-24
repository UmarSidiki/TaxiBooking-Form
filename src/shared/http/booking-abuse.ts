export function bookingAbuseReason(
  input: { companyWebsite?: string; formStartedAt?: number; turnstileToken?: string },
  now = Date.now(),
) {
  if (input.companyWebsite && input.companyWebsite.trim()) return "invalid_body" as const;
  if (typeof input.formStartedAt === "number" && input.formStartedAt > 0 && now - input.formStartedAt < 3000) {
    return "too_fast" as const;
  }
  return null;
}

export async function turnstileOk(token: string | undefined, ip: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  const body = new URLSearchParams({ secret, response: token, remoteip: ip });
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
  });
  const data = (await response.json()) as { success?: boolean };
  return Boolean(data.success);
}
