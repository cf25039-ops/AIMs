type RateLimitEntry = {
  attempts: number;
  resetAt: number;
};

const rateLimitMap = new Map<string, RateLimitEntry>();
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

function cleanupOldEntries() {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(ip);
    }
  }
}

setInterval(cleanupOldEntries, CLEANUP_INTERVAL);

export function checkRateLimit(
  ip: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000,
): { success: boolean; remaining: number; reset: number } {
  const now = Date.now();
  let entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    entry = {
      attempts: 0,
      resetAt: now + windowMs,
    };
    rateLimitMap.set(ip, entry);
  }

  if (entry.attempts >= maxAttempts) {
    return {
      success: false,
      remaining: 0,
      reset: Math.floor(entry.resetAt / 1000),
    };
  }

  entry.attempts++;
  const remaining = maxAttempts - entry.attempts;

  return {
    success: true,
    remaining,
    reset: Math.floor(entry.resetAt / 1000),
  };
}
