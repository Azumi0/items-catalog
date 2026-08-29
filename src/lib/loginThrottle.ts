/**
 * Brute-force throttle for the login form.
 *
 * The catalog is reachable from the internet (ADR-006), and `loginAction` is
 * the only door in. bcrypt at cost 10 buys ~80 ms per guess, which is not a
 * defence — against a wordlist it is a rounding error. This module turns the
 * fifth wrong password into a growing wait.
 *
 * State lives in this module rather than in SQLite for two reasons. The app
 * runs as a single Node process in one container, so a Map is enough; and a
 * database-backed counter would let an unauthenticated attacker grow `app.db`
 * on the NAS volume without limit, trading a login problem for a disk one.
 *
 * The cost of holding it in memory is that restarting the container forgives
 * every recorded failure. That is acceptable: restarting the container is not
 * something an attacker on the outside can trigger.
 */

/** Wrong passwords tolerated before the first lockout starts. */
const FAILURES_BEFORE_LOCKOUT = 5;

/** Isolated mistakes should not accumulate forever, so failures decay. */
const FAILURE_WINDOW_MS = 15 * 60 * 1000;

/**
 * How long a bucket remembers that it has been locked out before. Past this,
 * escalation resets to the bottom of the ladder — otherwise a household that
 * fat-fingers its password once a month would eventually face 15-minute waits.
 */
const ESCALATION_MEMORY_MS = 6 * 60 * 60 * 1000;

/**
 * Escalating lockouts, capped at 15 minutes rather than climbing to an hour.
 *
 * The cap is deliberate. Every lockout scheme lets an attacker who knows the
 * username lock the real owner out, and this app has exactly one household to
 * lock out. Fifteen minutes is long enough to make online guessing hopeless
 * (five guesses per quarter-hour) and short enough that being on the wrong end
 * of it in a shop is an annoyance rather than a lockout for the evening.
 */
const LOCKOUT_LADDER_MS = [60_000, 120_000, 300_000, 900_000];

/**
 * Ceiling on tracked buckets. Each failed login with an unseen username
 * allocates one, so without a bound an attacker cycling random usernames would
 * grow this Map until the container runs out of memory — a denial of service
 * handed over by the very thing meant to prevent one.
 */
const MAX_TRACKED_BUCKETS = 5_000;

interface Bucket {
  /** Failures accumulated inside the current window. */
  failures: number;
  /** Lockouts already served, indexing into LOCKOUT_LADDER_MS. */
  lockouts: number;
  lastFailureAt: number;
  /** Epoch ms until which this bucket refuses attempts; 0 when open. */
  blockedUntil: number;
}

const buckets = new Map<string, Bucket>();

export interface LoginIdentity {
  username: string;
  /** Null when the request carried no usable client address. */
  ip: string | null;
}

export interface ThrottleVerdict {
  blocked: boolean;
  /** Seconds the caller must wait; 0 when not blocked. */
  retryAfterSeconds: number;
}

const OPEN: ThrottleVerdict = { blocked: false, retryAfterSeconds: 0 };

/**
 * Both halves of an attempt's identity get their own bucket.
 *
 * The username is lower-cased so that alternating capitalisation cannot reset
 * the counter — authentication itself stays case-sensitive, so this only ever
 * merges buckets, never merges accounts.
 */
function bucketKeys({ username, ip }: LoginIdentity): string[] {
  const keys = [`user:${username.trim().toLowerCase()}`];
  if (ip) {
    keys.push(`ip:${ip}`);
  }
  return keys;
}

function prune(now: number): void {
  if (buckets.size <= MAX_TRACKED_BUCKETS) {
    return;
  }

  for (const [key, bucket] of buckets) {
    const idle = now - bucket.lastFailureAt > ESCALATION_MEMORY_MS;
    if (idle && bucket.blockedUntil <= now) {
      buckets.delete(key);
    }
  }

  // Still over budget: the Map is under active attack rather than merely
  // stale. Evict least-recently-failed first, which is where the noise is.
  if (buckets.size > MAX_TRACKED_BUCKETS) {
    const byAge = [...buckets.entries()].sort(
      (a, b) => a[1].lastFailureAt - b[1].lastFailureAt
    );
    for (const [key] of byAge.slice(0, buckets.size - MAX_TRACKED_BUCKETS)) {
      buckets.delete(key);
    }
  }
}

function lockoutDurationMs(lockouts: number): number {
  return LOCKOUT_LADDER_MS[Math.min(lockouts, LOCKOUT_LADDER_MS.length - 1)];
}

function verdictFor(keys: string[], now: number): ThrottleVerdict {
  let blockedUntil = 0;
  for (const key of keys) {
    const bucket = buckets.get(key);
    if (bucket && bucket.blockedUntil > now) {
      blockedUntil = Math.max(blockedUntil, bucket.blockedUntil);
    }
  }

  if (blockedUntil === 0) {
    return OPEN;
  }
  return {
    blocked: true,
    retryAfterSeconds: Math.ceil((blockedUntil - now) / 1000),
  };
}

/** Whether this identity may attempt a password right now. */
export function loginThrottleVerdict(identity: LoginIdentity): ThrottleVerdict {
  return verdictFor(bucketKeys(identity), Date.now());
}

/**
 * Record a rejected password and return the resulting verdict, so the caller
 * can tell the user immediately that the next attempt has to wait.
 */
export function registerFailedLogin(identity: LoginIdentity): ThrottleVerdict {
  const now = Date.now();
  const keys = bucketKeys(identity);

  for (const key of keys) {
    const bucket = buckets.get(key) ?? {
      failures: 0,
      lockouts: 0,
      lastFailureAt: now,
      blockedUntil: 0,
    };

    if (now - bucket.lastFailureAt > ESCALATION_MEMORY_MS) {
      bucket.lockouts = 0;
      bucket.failures = 0;
    } else if (now - bucket.lastFailureAt > FAILURE_WINDOW_MS) {
      bucket.failures = 0;
    }

    bucket.failures += 1;
    bucket.lastFailureAt = now;

    if (bucket.failures >= FAILURES_BEFORE_LOCKOUT) {
      bucket.blockedUntil = now + lockoutDurationMs(bucket.lockouts);
      bucket.lockouts += 1;
      bucket.failures = 0;
    }

    buckets.set(key, bucket);
  }

  prune(now);
  return verdictFor(keys, now);
}

/** Clear the counters behind a successful sign-in. */
export function registerSuccessfulLogin(identity: LoginIdentity): void {
  for (const key of bucketKeys(identity)) {
    buckets.delete(key);
  }
}

/** Test seam: drop all recorded state. */
export function resetLoginThrottle(): void {
  buckets.clear();
}
