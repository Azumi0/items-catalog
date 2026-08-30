/**
 * Brute-force throttle for the login form.
 *
 * The catalog is reachable from the internet (ADR-006), and `loginAction` is
 * the only door in. bcrypt at cost 10 buys ~80 ms per guess, which is not a
 * defence — against a wordlist it is a rounding error. This module turns the
 * fifth wrong password into a growing wait.
 *
 * Attempts are charged to one of two ledgers (ADR-007). A request carrying a
 * valid device cookie for the username it is trying is *trusted*: it is
 * counted in a bucket private to that device and nothing else. Every other
 * request is *untrusted* and lands in the shared per-username and per-address
 * buckets. That split exists so an attacker who knows the username can no
 * longer lock the household out of its own catalog — the household's phones
 * carry a cookie the attacker cannot obtain without first guessing the
 * password correctly.
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
 * The cap is deliberate. A lockout on the untrusted ledger still lets an
 * attacker who knows the username delay a household member who has no device
 * cookie to hand — a browser they have never signed in on before. Fifteen
 * minutes is long enough to make online guessing hopeless (five guesses per
 * quarter-hour) and short enough that being on the wrong end of it in a shop
 * is an annoyance rather than a lockout for the evening.
 */
const LOCKOUT_LADDER_MS = [60_000, 120_000, 300_000, 900_000];

/**
 * Ceiling on tracked buckets. Each failed login with an unseen username
 * allocates one, so without a bound an attacker cycling random usernames would
 * grow this Map until the container runs out of memory — a denial of service
 * handed over by the very thing meant to prevent one.
 */
const MAX_TRACKED_BUCKETS = 5_000;

/**
 * Ceiling on remembered burnt nonces.
 *
 * This one is a formality rather than a defence: burning a nonce requires
 * presenting a correctly sealed device cookie, which requires the device
 * secret, so an attacker cannot manufacture entries here the way they can
 * manufacture usernames. The bound exists so that a long-lived process with
 * many devices cannot grow this set without end.
 */
const MAX_BURNED_NONCES = 1_000;

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

/** Keys are `${login}:${nonce}`. Insertion-ordered, so eviction is FIFO. */
const burnedNonces = new Set<string>();

export interface LoginIdentity {
  username: string;
  /** Null when the request carried no usable client address. */
  ip: string | null;
  /**
   * Nonce of a valid, unburnt device cookie bound to this username, putting the
   * attempt on the trusted ledger. Null or absent for every other request.
   */
  deviceNonce?: string | null;
}

export interface ThrottleVerdict {
  blocked: boolean;
  /** Seconds the caller must wait; 0 when not blocked. */
  retryAfterSeconds: number;
}

const OPEN: ThrottleVerdict = { blocked: false, retryAfterSeconds: 0 };

/**
 * The username is lower-cased so that alternating capitalisation cannot reset
 * the counter — authentication itself stays case-sensitive, so this only ever
 * merges buckets, never merges accounts. The device cookie is keyed the same
 * way, so a cookie issued for "Domownik" is still recognised when the login
 * form is filled in as "domownik".
 */
export function normaliseLogin(username: string): string {
  return username.trim().toLowerCase();
}

function burnKey(username: string, nonce: string): string {
  return `${normaliseLogin(username)}:${nonce}`;
}

/**
 * Whether this device cookie has been spent on too many wrong passwords.
 *
 * A burnt nonce is not rejected outright — the request simply stops counting as
 * trusted and falls back to the shared buckets, which is where an attacker
 * holding a stolen cookie belongs.
 */
export function isDeviceNonceBurned(username: string, nonce: string): boolean {
  return burnedNonces.has(burnKey(username, nonce));
}

function burnDeviceNonce(username: string, nonce: string): void {
  if (burnedNonces.size >= MAX_BURNED_NONCES) {
    const oldest = burnedNonces.values().next();
    if (!oldest.done) {
      burnedNonces.delete(oldest.value);
    }
  }
  burnedNonces.add(burnKey(username, nonce));
}

/**
 * Which buckets an attempt is charged to.
 *
 * A trusted attempt is charged to its device bucket *and nothing else*. Leaving
 * the address bucket applied would reopen the hole this whole mechanism exists
 * to close: a household member on mobile data shares one carrier-grade NAT
 * address with thousands of strangers, so somebody else's attack would still
 * block them despite the cookie proving they have signed in here before.
 */
function bucketKeys({ username, ip, deviceNonce }: LoginIdentity): string[] {
  const login = normaliseLogin(username);

  if (deviceNonce) {
    return [`device:${login}:${deviceNonce}`];
  }

  const keys = [`user:${login}`];
  if (ip) {
    keys.push(`ip:${ip}`);
  }
  return keys;
}

/**
 * Drop what can be dropped once the Map is over budget.
 *
 * Deliberately free of a sort: this runs on the failure path, whose rate an
 * attacker sets, and sorting five thousand entries on every wrong password
 * would hand them a cheap way to spend the container's CPU. One pass collects
 * the stale entries; a second, only if that was not enough, drops entries by
 * age against a threshold computed in a single pass rather than by ordering
 * the whole Map.
 */
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

  if (buckets.size <= MAX_TRACKED_BUCKETS) {
    return;
  }

  // Still over budget: the Map is under active attack rather than merely
  // stale. Drop the oldest decile in one pass — approximate, but the point is
  // to bound memory, not to evict in an exact order.
  let oldest = Infinity;
  let newest = -Infinity;
  for (const bucket of buckets.values()) {
    if (bucket.lastFailureAt < oldest) oldest = bucket.lastFailureAt;
    if (bucket.lastFailureAt > newest) newest = bucket.lastFailureAt;
  }

  const cutoff = oldest + (newest - oldest) / 10;
  for (const [key, bucket] of buckets) {
    if (buckets.size <= MAX_TRACKED_BUCKETS) {
      break;
    }
    if (bucket.lastFailureAt <= cutoff && bucket.blockedUntil <= now) {
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
 * A wrong password on a trusted device.
 *
 * The device bucket has no lockout ladder. Once it fills, the nonce is burnt
 * and the bucket discarded: the client keeps its cookie but stops being
 * trusted, so its next attempt is charged to the shared buckets like any
 * other. That is the whole defence against a stolen cookie — it buys a thief
 * five guesses of their own, once, and then hands them back to the ordinary
 * lockout.
 *
 * The verdict returned is therefore open, not blocked. Nothing is barred at
 * this instant; what changed is which ledger the next attempt lands in.
 */
function registerFailedTrustedLogin(
  username: string,
  nonce: string,
  now: number
): ThrottleVerdict {
  const key = `device:${normaliseLogin(username)}:${nonce}`;
  const bucket = buckets.get(key) ?? {
    failures: 0,
    lockouts: 0,
    lastFailureAt: now,
    blockedUntil: 0,
  };

  if (now - bucket.lastFailureAt > FAILURE_WINDOW_MS) {
    bucket.failures = 0;
  }

  bucket.failures += 1;
  bucket.lastFailureAt = now;

  if (bucket.failures >= FAILURES_BEFORE_LOCKOUT) {
    burnDeviceNonce(username, nonce);
    buckets.delete(key);
    return OPEN;
  }

  buckets.set(key, bucket);
  prune(now);
  return OPEN;
}

/**
 * Record a rejected password and return the resulting verdict, so the caller
 * can tell the user immediately that the next attempt has to wait.
 */
export function registerFailedLogin(identity: LoginIdentity): ThrottleVerdict {
  const now = Date.now();

  if (identity.deviceNonce) {
    return registerFailedTrustedLogin(identity.username, identity.deviceNonce, now);
  }

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
  burnedNonces.clear();
}
