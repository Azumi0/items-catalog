import { test, expect, type Page } from '@playwright/test';
import { authTitle, pageTitle } from './helpers';

/**
 * The install offer, end to end.
 *
 * Headless Chromium never sends `beforeinstallprompt` on its own — it is
 * gated behind engagement heuristics no test can satisfy — and there is no
 * way to emulate `display-mode: standalone` either. So the browser half is
 * faked and the app half is real: the script below hands the app the event
 * the moment it starts listening, and everything after that is the component
 * under test. The decision table itself is unit-tested in
 * tests/installPrompt.test.ts, where it needs no browser at all.
 */

const PROMPT = '[data-testid="install-prompt"]';

/** Counts prompt() calls the app made, so the click can be shown to reach it. */
const CALLS = '__installPromptCalls';

/**
 * Delivers a synthetic `beforeinstallprompt` by wrapping addEventListener:
 * dispatching on `load` would race React's hydration, which is when the app
 * subscribes. Wrapping means the event arrives exactly once someone wants it.
 */
async function fakeInstallEvent(page: Page) {
  await page.addInitScript(() => {
    const store = window as unknown as Record<string, unknown>;
    store.__installPromptCalls = 0;

    const original = window.addEventListener.bind(window);
    window.addEventListener = function patched(
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions
    ) {
      original(type, listener, options);
      if (type !== 'beforeinstallprompt') return;

      const event = new Event('beforeinstallprompt');
      Object.assign(event, {
        prompt: () => {
          store.__installPromptCalls = (store.__installPromptCalls as number) + 1;
          return Promise.resolve();
        },
        userChoice: Promise.resolve({ outcome: 'dismissed' }),
      });
      setTimeout(() => window.dispatchEvent(event), 0);
    } as typeof window.addEventListener;
  });
}

test.describe('install offer', () => {
  test('a captured event becomes an offer whose button installs', async ({ page }) => {
    await fakeInstallEvent(page);
    await page.goto('/');

    const prompt = page.locator(PROMPT);
    await expect(prompt).toBeVisible();
    await expect(prompt.getByText('Zainstaluj Katalog na urządzeniu')).toBeVisible();

    await prompt.getByRole('button', { name: 'Zainstaluj' }).click();

    // The click reached the browser's own install flow.
    await expect.poll(() => page.evaluate((key) => (window as never)[key], CALLS)).toBe(1);

    // A spent event cannot be prompted with twice, so the offer retires until
    // the browser is willing to send another one.
    await expect(prompt).toBeHidden();
  });

  test('closing the offer survives a reload', async ({ page }) => {
    await fakeInstallEvent(page);
    await page.goto('/');

    const prompt = page.locator(PROMPT);
    await expect(prompt).toBeVisible();

    await prompt.getByRole('button', { name: 'Nie pokazuj więcej' }).click();
    await expect(prompt).toBeHidden();

    // The event is delivered again on the next load; the stored dismissal,
    // not the missing event, is what has to keep the offer away.
    await page.reload();
    await expect(pageTitle(page, 'Katalog')).toBeVisible();
    await expect(prompt).toBeHidden();
  });

  test('the offer stays off the screens without a session', async ({ page }) => {
    await fakeInstallEvent(page);
    await page.goto('/');
    await expect(page.locator(PROMPT)).toBeVisible();

    await page.getByRole('button', { name: 'Wyloguj się' }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(authTitle(page, 'Katalog Domowy')).toBeVisible();
    await expect(page.locator(PROMPT)).toBeHidden();

    // /setup cannot be reached directly once an account exists — it sends a
    // signed-out visitor to /login — so this is the whole of what there is to
    // check about it. Both screens render AuthScreen, which has no AppLayout
    // and therefore no offer by construction.
    await page.goto('/setup');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.locator(PROMPT)).toBeHidden();
  });

  test('the offer stays off a form in progress', async ({ page }) => {
    await fakeInstallEvent(page);
    await page.goto('/categories/new');

    await expect(page.getByRole('textbox', { name: 'Nazwa kategorii', exact: true })).toBeVisible();
    await expect(page.locator(PROMPT)).toBeHidden();
  });
});
