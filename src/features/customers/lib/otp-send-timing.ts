export const OTP_SEND_MIN_MS = 800;
export const OTP_SEND_JITTER_MS = 120;

type TimingOptions = {
  minMs?: number;
  jitterMs?: number;
  random?: () => number;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
};

function realSleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/**
 * Keep every send response on the same clock floor so a known and an unknown
 * email cannot be told apart by latency. The jitter only widens the floor.
 */
export async function padOtpSend(startedAt: number, options: TimingOptions = {}) {
  const minMs = options.minMs ?? OTP_SEND_MIN_MS;
  const jitterMs = options.jitterMs ?? OTP_SEND_JITTER_MS;
  const random = options.random ?? Math.random;
  const now = options.now ?? Date.now;
  const sleep = options.sleep ?? realSleep;
  const target = minMs + Math.floor(random() * jitterMs);
  const remaining = target - (now() - startedAt);
  if (remaining > 0) await sleep(remaining);
}
