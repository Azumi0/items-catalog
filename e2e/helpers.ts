import { expect, type Page } from '@playwright/test';

/**
 * Behavioural invariants that must survive a restyle. These stand in for the
 * pixel snapshots this suite deliberately does not take: a component-library
 * upgrade changes every pixel for legitimate reasons, but it must never leave
 * the page scrolling sideways or an image failing to decode.
 */

/** The layout is mobile-first; nothing may push the page off its own viewport. */
export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const el = document.documentElement;
    return el.scrollWidth - el.clientWidth;
  });
  // A sub-pixel rounding difference is not an overflow.
  expect(overflow).toBeLessThanOrEqual(1);
}

/** The <img> did not merely render — the browser actually decoded bytes. */
export async function expectImageLoaded(page: Page, selector: string) {
  await expect
    .poll(
      () =>
        page.locator(selector).first().evaluate((img) => {
          const image = img as HTMLImageElement;
          return image.complete ? image.naturalWidth : 0;
        }),
      { message: `image ${selector} never reported a non-zero naturalWidth` }
    )
    .toBeGreaterThan(0);
}

/** The top bar's own title, distinct from the identically-named nav tab. */
export function pageTitle(page: Page, title: string) {
  return page.getByRole('banner').getByText(title, { exact: true });
}

/**
 * The heading on /login and /setup. Those screens render AuthScreen, which
 * carries no app shell — no header, no nav — so they have no banner to scope
 * to and the plain text is the whole title.
 */
export function authTitle(page: Page, title: string) {
  return page.getByText(title, { exact: true });
}
