import { NextResponse } from "next/server";
import { clientIp } from "@/shared/http/client-ip";
import { memoryLimit } from "@/shared/http/memory-limit";
import { mongoWindowLimit } from "@/shared/http/rate-window";

const LIMITS: Record<string, number> = {
  booking: 10,
  quote: 30,
  otp: 5,
  login: 10,
  contact: 5,
  agent: 60,
  cronfail: 20,
};

export function tooMany(retryAfter: number) {
  return NextResponse.json(
    { error: "rate_limited" },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}

/** In-memory check first. Mongo (or Upstash when configured) only if memory allows. */
export async function limitSensitive(request: Request, bucket: keyof typeof LIMITS) {
  const ip = clientIp(request);
  const memory = memoryLimit(`${bucket}:${ip}`, LIMITS[bucket], 60_000);
  if (!memory.ok) return tooMany(memory.retryAfter);
  const stored = await mongoWindowLimit(`${bucket}:${ip}`, LIMITS[bucket]);
  if (!stored.ok) return tooMany(stored.retryAfter);
  return null;
}
