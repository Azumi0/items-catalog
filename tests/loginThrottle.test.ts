import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  isDeviceNonceBurned,
  loginThrottleVerdict,
  registerFailedLogin,
  registerSuccessfulLogin,
  resetLoginThrottle,
} from '@/lib/loginThrottle';

const FROM_HOME = { username: 'domownik', ip: '203.0.113.7' };

/** Drive the bucket to exactly the point where the next failure locks it. */
function failTimes(
  identity: { username: string; ip: string | null; deviceNonce?: string | null },
  times: number
) {
  let verdict = { blocked: false, retryAfterSeconds: 0 };
  for (let i = 0; i < times; i += 1) {
    verdict = registerFailedLogin(identity);
  }
  return verdict;
}

describe('Login Throttle Seam', () => {
  beforeEach(() => {
    resetLoginThrottle();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-29T20:00:00Z'));
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    resetLoginThrottle();
  });

  it('lets the first four wrong passwords through and blocks on the fifth', () => {
    expect(loginThrottleVerdict(FROM_HOME).blocked).toBe(false);

    const beforeLockout = failTimes(FROM_HOME, 4);
    expect(beforeLockout.blocked).toBe(false);
    expect(loginThrottleVerdict(FROM_HOME).blocked).toBe(false);

    const locked = registerFailedLogin(FROM_HOME);
    expect(locked.blocked).toBe(true);
    expect(locked.retryAfterSeconds).toBe(60);
  });

  it('reopens once the lockout elapses and escalates the next one', () => {
    failTimes(FROM_HOME, 5);
    expect(loginThrottleVerdict(FROM_HOME).blocked).toBe(true);

    vi.advanceTimersByTime(60_000);
    expect(loginThrottleVerdict(FROM_HOME).blocked).toBe(false);

    // A second run of failures costs twice as long — the ladder is 60s, 120s.
    const secondLockout = failTimes(FROM_HOME, 5);
    expect(secondLockout.blocked).toBe(true);
    expect(secondLockout.retryAfterSeconds).toBe(120);
  });

  it('forgets failures once the window passes without a new one', () => {
    failTimes(FROM_HOME, 4);

    vi.advanceTimersByTime(15 * 60 * 1000 + 1000);

    // The window reset the count, so this is failure #1, not #5.
    expect(registerFailedLogin(FROM_HOME).blocked).toBe(false);
  });

  it('clears the counters after a successful sign-in', () => {
    failTimes(FROM_HOME, 4);
    registerSuccessfulLogin(FROM_HOME);

    expect(failTimes(FROM_HOME, 4).blocked).toBe(false);
  });

  it('treats a username as the same account whatever its capitalisation', () => {
    failTimes({ username: 'Domownik', ip: null }, 3);
    failTimes({ username: 'DOMOWNIK', ip: null }, 2);

    expect(loginThrottleVerdict({ username: 'domownik', ip: null }).blocked).toBe(true);
  });

  it('blocks a whole address that sprays different usernames', () => {
    const attacker = '198.51.100.4';
    for (const username of ['admin', 'root', 'przemek', 'katalog', 'test']) {
      registerFailedLogin({ username, ip: attacker });
    }

    // A sixth, previously unseen username from that address is refused before
    // its password is ever checked.
    expect(loginThrottleVerdict({ username: 'kolejny', ip: attacker }).blocked).toBe(true);
    // A different address is untouched by it.
    expect(loginThrottleVerdict({ username: 'kolejny', ip: '203.0.113.9' }).blocked).toBe(false);
  });

  it('still throttles by username when no client address is available', () => {
    expect(failTimes({ username: 'domownik', ip: null }, 5).blocked).toBe(true);
    // Absent addresses must not collapse into one shared bucket.
    expect(loginThrottleVerdict({ username: 'ktos-inny', ip: null }).blocked).toBe(false);
  });
});

describe('Trusted device ledger', () => {
  const TRUSTED = { username: 'domownik', ip: '203.0.113.7', deviceNonce: 'nonce-abc' };

  beforeEach(() => {
    resetLoginThrottle();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-29T20:00:00Z'));
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    resetLoginThrottle();
  });

  it('signs in from a known device while the username is locked out', () => {
    // An attacker who knows the account name fills the shared bucket.
    failTimes({ username: 'domownik', ip: '198.51.100.4' }, 5);
    expect(loginThrottleVerdict({ username: 'domownik', ip: null }).blocked).toBe(true);

    // The household's own phone is untouched by it. This is the whole point of
    // the mechanism: the lockout that ADR-006 accepted as an unavoidable cost.
    expect(loginThrottleVerdict(TRUSTED).blocked).toBe(false);
  });

  it('ignores a lockout on an address the device happens to share', () => {
    // Carrier-grade NAT: somebody else behind the same public address attacks.
    const shared = '203.0.113.7';
    for (const username of ['admin', 'root', 'test', 'katalog', 'kolejny']) {
      registerFailedLogin({ username, ip: shared });
    }
    expect(loginThrottleVerdict({ username: 'ktos', ip: shared }).blocked).toBe(true);

    expect(loginThrottleVerdict(TRUSTED).blocked).toBe(false);
  });

  it('burns the nonce on the fifth wrong password instead of blocking', () => {
    const afterFive = failTimes(TRUSTED, 5);

    // Nothing is barred at this instant — what changed is the ledger.
    expect(afterFive.blocked).toBe(false);
    expect(isDeviceNonceBurned('domownik', 'nonce-abc')).toBe(true);
  });

  it('keeps trusted failures out of the shared buckets entirely', () => {
    failTimes(TRUSTED, 5);

    // Five wrong passwords on a trusted device must not have spent the
    // household's shared allowance, or a thief with a stolen cookie could lock
    // the owner out through the back door.
    expect(loginThrottleVerdict({ username: 'domownik', ip: null }).blocked).toBe(false);
    expect(loginThrottleVerdict({ username: 'ktos', ip: '203.0.113.7' }).blocked).toBe(false);
  });

  it('gives a burnt device the ordinary lockout, not a second private bucket', () => {
    failTimes(TRUSTED, 5);
    expect(isDeviceNonceBurned('domownik', 'nonce-abc')).toBe(true);

    // readTrustedDeviceNonce returns null for a burnt nonce, so the client is
    // back on the shared ledger and five more failures cost it the usual wait.
    const untrusted = { username: 'domownik', ip: '203.0.113.7' };
    expect(failTimes(untrusted, 5).blocked).toBe(true);
  });

  it('clears the device bucket after a successful sign-in', () => {
    failTimes(TRUSTED, 4);
    registerSuccessfulLogin(TRUSTED);

    expect(failTimes(TRUSTED, 4).blocked).toBe(false);
    expect(isDeviceNonceBurned('domownik', 'nonce-abc')).toBe(false);
  });

  it('matches the cookie to the account whatever the capitalisation typed', () => {
    failTimes({ ...TRUSTED, username: 'Domownik' }, 4);

    // Same device, same account, different typing — one bucket, so the fifth
    // attempt burns it rather than starting afresh.
    failTimes({ ...TRUSTED, username: 'DOMOWNIK' }, 1);
    expect(isDeviceNonceBurned('domownik', 'nonce-abc')).toBe(true);
  });
});

describe('Lockout logging', () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    resetLoginThrottle();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-29T20:00:00Z'));
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    resetLoginThrottle();
  });

  it('records a lockout, because nothing else will', () => {
    // DSM's auto-block never sees these requests — they arrive through the
    // reverse proxy straight into Node. Without this line the household has no
    // way to learn it is being attacked.
    failTimes({ username: 'domownik', ip: '198.51.100.4' }, 5);

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('user:domownik');
  });

  it('will not let an attacker set the rate the log is written at', () => {
    // Cycling usernames never trips the same bucket twice, so every five
    // requests would otherwise buy a line on the NAS volume.
    for (let i = 0; i < 20; i += 1) {
      failTimes({ username: `ofiara-${i}`, ip: null }, 5);
    }

    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('admits how many lines it swallowed', () => {
    failTimes({ username: 'pierwszy', ip: null }, 5);
    failTimes({ username: 'drugi', ip: null }, 5);
    failTimes({ username: 'trzeci', ip: null }, 5);

    vi.advanceTimersByTime(10_000);
    failTimes({ username: 'czwarty', ip: null }, 5);

    // The record has to be honest about what it left out, or a quiet log
    // reads as a quiet night.
    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn.mock.calls[1][0]).toContain('+2 more not logged');
  });
});
