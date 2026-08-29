import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  loginThrottleVerdict,
  registerFailedLogin,
  registerSuccessfulLogin,
  resetLoginThrottle,
} from '@/lib/loginThrottle';

const FROM_HOME = { username: 'domownik', ip: '203.0.113.7' };

/** Drive the bucket to exactly the point where the next failure locks it. */
function failTimes(identity: { username: string; ip: string | null }, times: number) {
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
  });

  afterEach(() => {
    vi.useRealTimers();
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
