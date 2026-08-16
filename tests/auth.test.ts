import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, sessionOptions } from '@/lib/auth';

describe('Auth & Session Seam', () => {
  it('hashes passwords and correctly verifies valid passwords', async () => {
    const password = 'mySecurePassword123!';
    const hash = await hashPassword(password);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);

    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);

    const isInvalid = await verifyPassword('wrongPassword', hash);
    expect(isInvalid).toBe(false);
  });

  it('provides secure session options for iron-session', () => {
    expect(sessionOptions.cookieName).toBe('item_catalog_session');
    expect(sessionOptions.password).toBeDefined();
    expect(sessionOptions.password.length).toBeGreaterThanOrEqual(32);
    expect(sessionOptions.cookieOptions?.httpOnly).toBe(true);
  });
});
