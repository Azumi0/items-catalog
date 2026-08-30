import { cookies } from 'next/headers';
import { sealData, unsealData } from 'iron-session';
import crypto from 'node:crypto';
import { getDeviceCookieSecret } from './auth';
import { isDeviceNonceBurned, normaliseLogin } from './loginThrottle';

/**
 * The device cookie (ADR-007).
 *
 * It is emphatically **not** a credential. It authenticates nobody and opens
 * nothing — a request carrying it still has to present the right password.
 * All it decides is which ledger a login attempt is charged to: its own
 * private bucket, or the shared per-username and per-address ones. That is
 * what lets the household walk past a lockout an attacker has caused on their
 * username without weakening the lockout itself.
 *
 * Because it is not a credential, stealing one is worth little: the thief buys
 * five guesses in a bucket of their own, after which the nonce is burnt and
 * they are back on the shared ledger with everybody else.
 *
 * Validation is stateless — the seal carries its own integrity and expiry, so
 * a container restart does not un-trust every phone in the house. The
 * deliberate consequence is that a copy of a cookie stays valid until it is
 * burnt or expires; there is no server-side list of live nonces to revoke
 * against. Issuing a replacement on every sign-in would *look* like rotation
 * while invalidating nothing, so it is not done: a new cookie is issued only
 * when the request arrived without a usable one.
 */

export const DEVICE_COOKIE_NAME = 'item_catalog_device';

/**
 * 400 days. Chrome caps persistent cookies at 400 days regardless of what the
 * server asks for, so anything longer would be a number that only looks bigger.
 */
export const DEVICE_COOKIE_MAX_AGE_SECONDS = 400 * 24 * 60 * 60;

interface DeviceCookiePayload {
  /** The account this cookie vouches for, normalised. */
  login: string;
  /** Random per-device value; the thing that gets burnt. */
  nonce: string;
}

function isPayload(value: unknown): value is DeviceCookiePayload {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const { login, nonce } = value as Record<string, unknown>;
  return typeof login === 'string' && typeof nonce === 'string' && nonce.length > 0;
}

/**
 * The nonce this request may be trusted under, or null.
 *
 * Null covers every way a request can fail to be trusted, and they are all the
 * same to the caller: no cookie, a cookie that will not unseal, one issued for
 * a different account than the one being attempted, and one whose nonce has
 * been burnt. None of these is an error — each simply means the attempt is
 * charged to the shared ledger.
 */
export async function readTrustedDeviceNonce(username: string): Promise<string | null> {
  const jar = await cookies();
  const sealed = jar.get(DEVICE_COOKIE_NAME)?.value;
  if (!sealed) {
    return null;
  }

  let payload: unknown;
  try {
    payload = await unsealData(sealed, {
      password: getDeviceCookieSecret(),
      ttl: DEVICE_COOKIE_MAX_AGE_SECONDS,
    });
  } catch {
    // Tampered, truncated, sealed under a rotated secret, or simply expired.
    return null;
  }

  if (!isPayload(payload)) {
    return null;
  }

  // A cookie vouches for one account. Presenting it while trying to sign in as
  // somebody else says nothing about *this* attempt, so it is worth nothing.
  if (payload.login !== normaliseLogin(username)) {
    return null;
  }

  if (isDeviceNonceBurned(username, payload.nonce)) {
    return null;
  }

  return payload.nonce;
}

/**
 * Mark this browser as one that has signed in successfully, so future attempts
 * from it are throttled on their own.
 *
 * Called only after authentication has already succeeded — that is the entire
 * basis on which the cookie is worth anything, and it is why an attacker on
 * the outside can never obtain one.
 */
export async function issueDeviceCookie(username: string): Promise<void> {
  const sealed = await sealData(
    { login: normaliseLogin(username), nonce: crypto.randomUUID() } satisfies DeviceCookiePayload,
    {
      password: getDeviceCookieSecret(),
      ttl: DEVICE_COOKIE_MAX_AGE_SECONDS,
    }
  );

  const jar = await cookies();
  jar.set(DEVICE_COOKIE_NAME, sealed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    // Stricter than the session cookie needs to be, and free here: this cookie
    // is only ever read by a form post the household made from the login page
    // itself, never by a navigation arriving from somewhere else.
    sameSite: 'strict',
    path: '/',
    maxAge: DEVICE_COOKIE_MAX_AGE_SECONDS,
  });
}
