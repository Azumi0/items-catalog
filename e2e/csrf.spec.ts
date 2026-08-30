import { test, expect } from '@playwright/test';
import { ACCOUNT } from './constants';
import { authTitle } from './helpers';

/**
 * Cross-site request forgery, end to end.
 *
 * This exists because the protection is Next's rather than ours (ADR-007) —
 * there is no module of our own to unit-test, and a test against Next's
 * internal isCsrfOriginAllowed would only assert that somebody else's code
 * does what it does. What is worth pinning is the behaviour the app shows: a
 * Server Action post carrying somebody else's Origin does not run. If an
 * upgrade or a config change quietly turns that off, this is what says so.
 *
 * Rewriting the header on the browser's own request does not work — Chromium
 * owns `Origin` and puts it back — so the test captures a genuine Server
 * Action post and replays it out of band, where the header is ours to set.
 * The replay is sent twice on purpose: once with the app's real origin, which
 * must be accepted, and once with a foreign one, which must not. Without that
 * first half a merely malformed replay would fail for the wrong reason and the
 * test would still look green.
 */
test.describe('cross-origin server action', () => {
  test('a login post carrying a foreign Origin is refused', async ({ page, baseURL }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Wyloguj się' }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(authTitle(page, 'Katalog Domowy')).toBeVisible();

    // Capture a real sign-in: its action id, its headers and its body.
    let captured: { headers: Record<string, string>; body: Buffer } | null = null;
    await page.route('**/login', async (route) => {
      const request = route.request();
      if (request.method() === 'POST' && !captured) {
        captured = {
          headers: request.headers(),
          body: request.postDataBuffer() ?? Buffer.alloc(0),
        };
      }
      await route.continue();
    });

    await page.getByRole('textbox', { name: 'Login', exact: true }).fill(ACCOUNT.username);
    await page.getByRole('textbox', { name: 'Hasło', exact: true }).fill(ACCOUNT.password);
    await page.getByRole('button', { name: 'Zaloguj się' }).click();
    await expect(page).toHaveURL(/\/$/);

    expect(captured, 'no Server Action post was captured to replay').not.toBeNull();
    const { headers, body } = captured!;
    const ownOrigin = new URL(baseURL!).origin;

    // Control: the same bytes, from where the app actually lives. If this is
    // not accepted, the replay is broken and the assertion below proves
    // nothing.
    const sameOrigin = await page.request.post('/login', {
      headers: { ...headers, origin: ownOrigin },
      data: body,
      maxRedirects: 0,
    });
    expect(sameOrigin.status()).toBeLessThan(400);

    // The real assertion: one header different, and Next refuses to run the
    // action at all — correct credentials, valid action id, live session
    // cookie and all.
    const crossOrigin = await page.request.post('/login', {
      headers: { ...headers, origin: 'https://zbieracz.example' },
      data: body,
      maxRedirects: 0,
    });
    expect(crossOrigin.status()).toBeGreaterThanOrEqual(400);
  });
});
