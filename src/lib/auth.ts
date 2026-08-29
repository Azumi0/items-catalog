import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { SessionOptions } from 'iron-session';

export interface SessionData {
  user?: {
    id: string;
    username: string;
  };
  isLoggedIn: boolean;
}

export const defaultSession: SessionData = {
  isLoggedIn: false,
};

const MIN_SECRET_LENGTH = 32;

// Used only outside production, so `pnpm dev` and the test suite need no setup.
const DEV_SECRET = 'dev_only_insecure_secret_at_least_32_characters_long';

// Verbatim values shipped in docs and compose files. Deploying one of these is
// the same as having no secret at all — every reader of the repo knows it.
const PLACEHOLDER_SECRETS = new Set([
  'complex_password_at_least_32_characters_long_for_iron_session',
  'super-tajny-losowy-klucz-minimum-32-znaki',
  'ZMIEN-MNIE-na-losowy-ciag-minimum-32-znaki',
]);

function resolveSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;

  if (process.env.NODE_ENV !== 'production') {
    return secret && secret.length >= MIN_SECRET_LENGTH ? secret : DEV_SECRET;
  }

  if (!secret) {
    throw new Error(
      'SESSION_SECRET is not set. Refusing to start with a predictable session key — ' +
        'anyone could forge a session cookie. Generate one with: openssl rand -base64 32'
    );
  }
  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `SESSION_SECRET must be at least ${MIN_SECRET_LENGTH} characters, got ${secret.length}.`
    );
  }
  if (PLACEHOLDER_SECRETS.has(secret)) {
    throw new Error(
      'SESSION_SECRET is still the placeholder value from the docs. Replace it with a ' +
        'real random value: openssl rand -base64 32'
    );
  }
  return secret;
}

export const sessionOptions: SessionOptions = {
  // Resolved lazily: `next build` runs with NODE_ENV=production but no
  // SESSION_SECRET, so an eager throw here would break the Docker build.
  get password() {
    return resolveSessionSecret();
  },
  cookieName: 'item_catalog_session',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 1 week
  },
};

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

let decoyHash: Promise<string> | null = null;

/**
 * A well-formed bcrypt hash of a value nobody can guess, for comparing against
 * when the submitted username does not exist.
 *
 * Without it, a login for an unknown account returns as fast as the database
 * lookup while a wrong password for a real account costs a full bcrypt verify.
 * That gap is measurable over the network and turns the login form into an
 * account-name oracle — which matters here because the one account is likely
 * named after its owner.
 *
 * Built lazily and cached: hashing once at import would add ~80 ms to every
 * cold start for a value most requests never touch.
 */
export function getDecoyPasswordHash(): Promise<string> {
  decoyHash ??= hashPassword(crypto.randomUUID());
  return decoyHash;
}
