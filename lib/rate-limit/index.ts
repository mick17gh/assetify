import { RATE_LIMIT } from "@/constants";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function assertRateLimit(key: string, max: number = RATE_LIMIT.DEFAULT_MAX): void {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + RATE_LIMIT.WINDOW_MS });
    return;
  }

  if (bucket.count >= max) {
    throw new Error("RATE_LIMITED");
  }

  bucket.count += 1;
  buckets.set(key, bucket);
}
