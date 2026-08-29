import { test, expect } from '@playwright/test';
import { expectNoHorizontalOverflow } from './helpers';

/**
 * The icon field replaced a grid of eight fixed icons with a search over the
 * whole ~6250-icon Tabler library. Three things about that are worth a browser
 * to check, because none of them survive as a unit test: the library really is
 * reachable from the form, the grid really is windowed, and the icon a person
 * picks really does come back on the catalog screen.
 */

const CATEGORY = 'Rowery';

test.describe.configure({ mode: 'serial' });

/** Tiles the grid has actually put in the DOM, whatever the result count says. */
const TILES = '[role="dialog"] button.mantine-ActionIcon-root:not([aria-label="Zamknij"])';

test('an icon is picked out of the whole Tabler library', async ({ page }) => {
  await page.goto('/categories/new');

  await page.getByRole('textbox', { name: 'Nazwa kategorii', exact: true }).fill(CATEGORY);
  await page.getByRole('button', { name: 'Wybierz ikonę' }).first().click();

  // The search box takes focus on open, so a phone keyboard is already up.
  const search = page.getByRole('textbox', { name: 'Szukaj ikony' });
  await expect(search).toBeFocused();
  await expect(page.getByText(/Biblioteka: \d{4} ikon Tabler\./)).toBeVisible();

  // Windowing: thousands of icons in the pool, two screens of them in the DOM.
  // Rendering all of them is what this replaces — it locks the tab for seconds.
  const rendered = await page.locator(TILES).count();
  expect(rendered).toBeGreaterThan(0);
  expect(rendered).toBeLessThan(200);

  // Polish query against an English library — the placeholder promises it.
  await search.fill('rower');
  await expect(page.getByText(/Znaleziono \d+ z \d+ ikon Tabler\./)).toBeVisible();

  const bike = page.getByRole('button', { name: 'Bike', exact: true });
  await expect(bike).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await bike.click();

  // Picking closes the modal and fills the field — there is no confirm step.
  await expect(search).toBeHidden();
  await expect(page.getByRole('button', { name: 'Zmień ikonę' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Usuń (Bike)' })).toBeVisible();
  await expect(page.locator('svg.tabler-icon-bike')).toBeVisible();

  await page.getByRole('button', { name: 'Utwórz kategorię' }).click();
  await expect(page).toHaveURL(/\/categories$/);

  // The chosen icon survives the round trip through the database and renders
  // on a screen that never loads the picker.
  await expect(page.locator('svg.tabler-icon-bike')).toBeVisible();
  await page.goto('/');
  await expect(page.locator('svg.tabler-icon-bike')).toBeVisible();
});

test('a search that matches nothing says so, and Escape gets out', async ({ page }) => {
  await page.goto('/categories/new');
  await page.getByRole('button', { name: 'Wybierz ikonę' }).first().click();

  const search = page.getByRole('textbox', { name: 'Szukaj ikony' });
  await search.fill('zzzqqqxxx');

  // toBeVisible alone passed even when the message sat a full screen below
  // the grid's own scroll container. It has to be where someone can read it.
  const empty = page.getByText('Brak ikon dla „zzzqqqxxx”');
  await expect(empty).toBeVisible();
  await expect(empty).toBeInViewport();
  await expect(page.locator(TILES)).toHaveCount(0);

  await page.keyboard.press('Escape');
  await expect(search).toBeHidden();
});

test('the picked icon can be taken back off', async ({ page }) => {
  await page.goto('/categories');
  await page.getByRole('link', { name: `Edytuj kategorię ${CATEGORY}` }).click();

  await expect(page.getByRole('button', { name: 'Usuń (Bike)' })).toBeVisible();
  await page.getByRole('button', { name: 'Usuń (Bike)' }).click();

  await expect(page.getByRole('button', { name: 'Wybierz ikonę' }).first()).toBeVisible();
  await expect(page.locator('svg.tabler-icon-bike')).toBeHidden();

  await page.getByRole('button', { name: 'Zapisz zmiany' }).click();
  await expect(page).toHaveURL(/\/categories$/);
  await expect(page.locator('svg.tabler-icon-bike')).toBeHidden();
});
