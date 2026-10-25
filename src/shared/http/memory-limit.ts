const buckets = new Map<string, { count: number; reset: number }>();

export function memoryLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const row = buckets.get(key);
  if (!row || row.reset <= now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return { ok: true as const, retryAfter: 0 };
  }
  row.count += 1;
  if (row.count > limit) {
    return { ok: false as const, retryAfter: Math.max(1, Math.ceil((row.reset - now) / 1000)) };
  }
  return { ok: true as const, retryAfter: 0 };
}

export function resetMemoryLimits() {
  buckets.clear();
}
