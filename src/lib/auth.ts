import bcrypt from 'bcryptjs';
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

const DEFAULT_SECRET = 'complex_password_at_least_32_characters_long_for_iron_session';

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || DEFAULT_SECRET,
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
