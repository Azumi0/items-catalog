import { describe, it, expect } from 'vitest';
import { proxy } from '@/proxy';
import { NextRequest } from 'next/server';

describe('Next.js Route Proxy Seam', () => {
  it('allows public routes without session cookie', () => {
    const publicUrls = [
      'http://localhost:3000/login',
      'http://localhost:3000/setup',
      'http://localhost:3000/manifest.json',
      'http://localhost:3000/_next/static/chunk.js',
      'http://localhost:3000/api/images/thumbs/pic.webp',
      // The favicon and the apple-touch-icon are fetched by a browser sitting
      // on /login with no session at all. If /icons ever stops being waved
      // through, they turn into redirects to /login and the login page loses
      // its icon — silently, because a redirect is not an error.
      'http://localhost:3000/icons/app-icon-32.png',
      'http://localhost:3000/icons/app-icon-180.png',
      'http://localhost:3000/icons/app-icon-192.png',
    ];

    for (const url of publicUrls) {
      const req = new NextRequest(url);
      const res = proxy(req);
      expect(res.headers.get('location')).toBeNull();
    }
  });

  it('redirects to /login on protected routes when session cookie is absent', () => {
    const protectedUrls = [
      'http://localhost:3000/',
      'http://localhost:3000/items/new',
      'http://localhost:3000/items/some-id',
      'http://localhost:3000/items/some-id/edit',
      'http://localhost:3000/categories',
      'http://localhost:3000/users',
    ];

    for (const url of protectedUrls) {
      const req = new NextRequest(url);
      const res = proxy(req);
      expect(res.headers.get('location')).toBe('http://localhost:3000/login');
    }
  });

  it('allows access to protected routes when session cookie is present', () => {
    const req = new NextRequest('http://localhost:3000/items/new', {
      headers: {
        cookie: 'item_catalog_session=encrypted_session_payload',
      },
    });

    const res = proxy(req);
    expect(res.headers.get('location')).toBeNull();
  });
});
