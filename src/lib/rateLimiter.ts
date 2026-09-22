/**
 * Client-side / In-Memory Sliding Window Rate Limiter
 * Provides abuse prevention on sensitive actions:
 * - Authentication (Login & Signup)
 * - Forgot Password & Password Reset Requests
 * - Verification Email Resends
 * - Order Placement & Checkout
 * - Service Bookings
 */

export interface RateLimitConfig {
  maxRequests: number; // Maximum allowed requests within window
  windowSeconds: number; // Time window in seconds
  actionName?: string; // Human-friendly name for error messages
}

interface RateLimitRecord {
  timestamps: number[];
  lockedUntil?: number;
}

const STORAGE_PREFIX = 'elitebath_ratelimit_';

/**
 * Checks if the action is currently permitted under rate limits.
 * Returns { allowed: boolean, remainingAttempts: number, waitSeconds: number, errorMessage?: string }
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): {
  allowed: boolean;
  remainingAttempts: number;
  waitSeconds: number;
  errorMessage?: string;
} {
  const storageKey = `${STORAGE_PREFIX}${key}`;
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;

  let record: RateLimitRecord = { timestamps: [] };

  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      record = JSON.parse(raw);
    }
  } catch (e) {
    record = { timestamps: [] };
  }

  // 1. Check if currently locked
  if (record.lockedUntil && record.lockedUntil > now) {
    const waitSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    const actionLabel = config.actionName || 'requests';
    return {
      allowed: false,
      remainingAttempts: 0,
      waitSeconds,
      errorMessage: `Too many ${actionLabel}. Please wait ${waitSeconds} second${
        waitSeconds === 1 ? '' : 's'
      } before trying again.`,
    };
  }

  // 2. Clean timestamps outside the sliding window
  const validTimestamps = (record.timestamps || []).filter(
    (ts) => now - ts < windowMs
  );

  if (validTimestamps.length >= config.maxRequests) {
    const oldest = validTimestamps[0];
    const waitSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    const actionLabel = config.actionName || 'requests';

    // Lock for the wait period
    record.lockedUntil = now + waitSeconds * 1000;
    try {
      localStorage.setItem(storageKey, JSON.stringify(record));
    } catch {}

    return {
      allowed: false,
      remainingAttempts: 0,
      waitSeconds,
      errorMessage: `Rate limit reached for ${actionLabel}. Please try again in ${waitSeconds} second${
        waitSeconds === 1 ? '' : 's'
      }.`,
    };
  }

  const remainingAttempts = Math.max(0, config.maxRequests - validTimestamps.length);

  return {
    allowed: true,
    remainingAttempts,
    waitSeconds: 0,
  };
}

/**
 * Records an attempt for the specified rate limit key.
 */
export function recordRateLimitAttempt(key: string, config: RateLimitConfig): void {
  const storageKey = `${STORAGE_PREFIX}${key}`;
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;

  let record: RateLimitRecord = { timestamps: [] };

  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      record = JSON.parse(raw);
    }
  } catch {
    record = { timestamps: [] };
  }

  const validTimestamps = (record.timestamps || []).filter(
    (ts) => now - ts < windowMs
  );
  validTimestamps.push(now);

  record.timestamps = validTimestamps;
  try {
    localStorage.setItem(storageKey, JSON.stringify(record));
  } catch {}
}

/**
 * Resets the rate limit for a given key upon successful action (e.g., successful login)
 */
export function resetRateLimit(key: string): void {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
  } catch {}
}
