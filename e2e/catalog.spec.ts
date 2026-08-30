import { test, expect } from '@playwright/test';
import { MAIN_PHOTO } from './global-setup';
import {
  expectImageLoaded,
  expectNoHorizontalOverflow,
  pageTitle,
} from './helpers';

const CATEGORY = 'Narzędzia';
const ITEM = 'Wiertarka udarowa w zielonej walizce';

/** A stored thumbnail. Mantine's Image swaps in a data-URI placeholder when
 *  the fetch fails, so this selector matching at all means the real one served. */
const THUMB = 'img[src^="/api/images/thumbs/"]';

// Each step builds on the previous one's data: a category has to exist before
// an item can go in it, and an item before it can be deleted.
test.describe.configure({ mode: 'serial' });

test('a category can be created', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('navigation').getByRole('link', { name: 'Kategorie' }).click();
  await expect(page).toHaveURL(/\/categories$/);

  await page.getByRole('link', { name: 'Nowa kategoria' }).click();
  await expect(page).toHaveURL(/\/categories\/new$/);
  await expectNoHorizontalOverflow(page);

  await page.getByRole('textbox', { name: 'Nazwa kategorii', exact: true }).fill(CATEGORY);
  await page.getByRole('button', { name: 'Utwórz kategorię' }).click();

  await expect(page).toHaveURL(/\/categories$/);
  await expect(page.getByText(CATEGORY, { exact: true }).first()).toBeVisible();

  // It also has to reach the catalog, which reads categories separately.
  await page.goto('/');
  await expect(page.getByText(CATEGORY, { exact: true }).first()).toBeVisible();
});

test('an item can be added with a photo', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('link', { name: 'Dodaj przedmiot' }).click();
  await expect(page).toHaveURL(/\/items\/new/);

  // Every photo field renders a hidden file input; the main photo's dropzone
  // comes first in the DOM, matching the order of the fields on screen.
  await page.locator('input[type="file"]').first().setInputFiles(MAIN_PHOTO);

  // The preview replaces the dropzone once a file is chosen — that swap is
  // what confirms the browser accepted it.
  await expect(page.getByAltText('Zdjęcie główne')).toBeVisible();

  await page.getByRole('button', { name: CATEGORY }).click();
  await page.getByRole('textbox', { name: 'Opis', exact: true }).fill(ITEM);
  await expectNoHorizontalOverflow(page);

  await page.getByRole('button', { name: 'Dodaj przedmiot' }).click();

  // Lands in the list of the category it was filed under.
  await expect(page).toHaveURL(/\/categories\/[^/]+\/items$/);
  await expect(page.getByText(ITEM)).toBeVisible();

  // sharp wrote a thumbnail, the images route served it, the browser decoded
  // it: the whole upload path in one assertion.
  await expect(page.locator(THUMB).first()).toBeVisible();
  await expectImageLoaded(page, THUMB);
  await expectNoHorizontalOverflow(page);
});

test('an item can be opened and deleted', async ({ page }) => {
  await page.goto('/');
  await page.getByText(CATEGORY, { exact: true }).first().click();

  await expect(page).toHaveURL(/\/categories\/[^/]+\/items$/);
  await expect(pageTitle(page, CATEGORY)).toBeVisible();

  await page.getByRole('link', { name: ITEM }).click();
  await expect(page).toHaveURL(/\/items\/[^/]+$/);
  await expect(page.getByText(ITEM)).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.getByRole('button', { name: 'Usuń przedmiot' }).click();

  // The confirmation is a bottom sheet; its own button is labelled "Usuń".
  await expect(page.getByText('Usunąć przedmiot?')).toBeVisible();
  await page.getByRole('button', { name: 'Usuń', exact: true }).click();

  await expect(page).toHaveURL(/\/categories\/[^/]+\/items$/);
  await expect(page.getByText('Brak przedmiotów')).toBeVisible();
});

/**
 * Chrome on Android sends an image-only `accept` to the system photo picker,
 * which lists the gallery and offers no shutter, so a field whose only input
 * is the dropzone cannot take a live photo at all. Each photo field therefore
 * carries a second input that asks for the camera outright — the button this
 * checks — and it has to be wired to the same preview as the dropzone.
 * See ADR-004 §3.1.
 */
for (const [screen, path, previewAlt] of [
  ['the item form', '/items/new', 'Zdjęcie główne'],
  ['the category form', '/categories/new', 'Zdjęcie kategorii'],
] as const) {
  test(`${screen} can take a photo, not only pick one`, async ({ page }) => {
    await page.goto(path);

    await expect(
      page.getByRole('button', { name: 'Zrób zdjęcie' })
    ).toBeVisible();

    const camera = page.locator('input[capture="environment"]').first();
    await expect(camera).toHaveAttribute('accept', 'image/*');

    // The shot has to land in the same slot a gallery pick would.
    await camera.setInputFiles(MAIN_PHOTO);
    await expect(page.getByAltText(previewAlt)).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
}
