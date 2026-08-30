import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * A cookie jar standing in for `next/headers`.
 *
 * The module under test only ever reads one cookie and writes one cookie, so
 * the fake needs no more than that — but it must be a *real* store rather than
 * a stub returning fixed values, because the point of most of these tests is
 * that a value written by `issueDeviceCookie` is the value
 * `readTrustedDeviceNonce` later accepts.
 */
const jar = new Map<string, string>();
const setOptions: Record<string, unknown>[] = [];

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) =>
      jar.has(name) ? { name, value: jar.get(name) } : undefined,
    set: (name: string, value: string, options: Record<string, unknown>) => {
      jar.set(name, value);
      setOptions.push(options);
    },
  }),
}));

const {
  DEVICE_COOKIE_NAME,
  DEVICE_COOKIE_MAX_AGE_SECONDS,
  issueDeviceCookie,
  readTrustedDeviceNonce,
} = await import('@/lib/deviceCookie');
const { resetLoginThrottle, registerFailedLogin } = await import('@/lib/loginThrottle');

describe('Device cookie', () => {
  beforeEach(() => {
    jar.clear();
    setOptions.length = 0;
    resetLoginThrottle();
  });

  afterEach(() => {
    resetLoginThrottle();
  });

  it('recognises the cookie it issued', async () => {
    await issueDeviceCookie('domownik');

    const nonce = await readTrustedDeviceNonce('domownik');
    expect(nonce).toBeTruthy();
  });

  it('trusts nothing when no cookie was ever issued', async () => {
    expect(await readTrustedDeviceNonce('domownik')).toBeNull();
  });

  it('gives every device a nonce of its own', async () => {
    await issueDeviceCookie('domownik');
    const first = await readTrustedDeviceNonce('domownik');

    jar.clear();
    await issueDeviceCookie('domownik');
    const second = await readTrustedDeviceNonce('domownik');

    // Two browsers must not share a bucket, or one of them filling it would
    // burn the other's trust.
    expect(second).not.toBe(first);
  });

  it('refuses a cookie issued for a different account', async () => {
    await issueDeviceCookie('domownik');

    // The cookie vouches for one account. Presenting it while trying to sign
    // in as somebody else says nothing about this attempt.
    expect(await readTrustedDeviceNonce('ktos-inny')).toBeNull();
  });

  it('accepts the account however it was capitalised in the form', async () => {
    await issueDeviceCookie('Domownik');

    expect(await readTrustedDeviceNonce('DOMOWNIK')).toBeTruthy();
  });

  it('refuses a tampered seal rather than throwing', async () => {
    await issueDeviceCookie('domownik');
    const sealed = jar.get(DEVICE_COOKIE_NAME)!;
    jar.set(DEVICE_COOKIE_NAME, sealed.slice(0, -4) + 'AAAA');

    // A caller in the login path must never see an exception here: a corrupt
    // cookie means "untrusted", not "error".
    expect(await readTrustedDeviceNonce('domownik')).toBeNull();
  });

  it('refuses a value that is not a seal at all', async () => {
    jar.set(DEVICE_COOKIE_NAME, 'garbage');

    expect(await readTrustedDeviceNonce('domownik')).toBeNull();
  });

  it('stops trusting a device once its nonce is burnt', async () => {
    await issueDeviceCookie('domownik');
    const nonce = await readTrustedDeviceNonce('domownik');

    // Five wrong passwords on the trusted ledger burn it.
    for (let i = 0; i < 5; i += 1) {
      registerFailedLogin({ username: 'domownik', ip: null, deviceNonce: nonce });
    }

    // The cookie is still in the jar and still unseals — it has simply stopped
    // being worth anything, which is what puts a cookie thief back on the
    // shared ledger.
    expect(jar.get(DEVICE_COOKIE_NAME)).toBeTruthy();
    expect(await readTrustedDeviceNonce('domownik')).toBeNull();
  });

  it('writes a cookie the browser will keep and script cannot read', async () => {
    await issueDeviceCookie('domownik');

    expect(setOptions).toHaveLength(1);
    expect(setOptions[0]).toMatchObject({
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
      maxAge: DEVICE_COOKIE_MAX_AGE_SECONDS,
    });
  });
});
