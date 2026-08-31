import { test, expect } from '@playwright/test';
import { MAIN_PHOTO } from './global-setup';
import { expectNoHorizontalOverflow } from './helpers';

/**
 * The AI button's states, checked in a real browser because they depend on
 * form state a unit test cannot see: which photo is on screen, and whether the
 * description field already has something in it.
 *
 * Nothing here clicks through to generation. The server under test carries a
 * throwaway GEMINI_API_KEY so the button renders, but a real click would send
 * a photo to Google — an outbound call this suite must not make, and one that
 * would fail on a machine with no route out. Everything up to that boundary is
 * fair game; the boundary itself is covered by tests/gemini.test.ts against a
 * mocked fetch.
 */

const CATEGORY = 'Pudełka';
const ITEM = 'Karton po archiwum';
const BUTTON = 'Wygeneruj opis z AI';

test.describe.configure({ mode: 'serial' });

let itemUrl: string;

test('the button is disabled until a main photo is on screen', async ({ page }) => {
  // This spec owns its own category so it does not depend on catalog.spec.ts.
  await page.goto('/categories/new');
  await page.getByRole('textbox', { name: 'Nazwa kategorii', exact: true }).fill(CATEGORY);
  await page.getByRole('button', { name: 'Utwórz kategorię' }).click();
  await expect(page).toHaveURL(/\/categories$/);

  await page.goto('/items/new');

  const button = page.getByRole('button', { name: BUTTON });
  await expect(button).toBeVisible();
  await expect(button).toBeDisabled();

  // A disabled control with no explanation is a dead end; the hint says which
  // step comes first.
  await expect(page.getByText('Najpierw dodaj zdjęcie główne.')).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test('picking a photo enables it, without the photo being saved first', async ({ page }) => {
  await page.goto('/items/new');

  await page.locator('input[type="file"]').first().setInputFiles(MAIN_PHOTO);
  await expect(page.getByAltText('Zdjęcie główne')).toBeVisible();

  // The point of the whole file-based design: nothing has been written to disk
  // and the item does not exist, yet the control is live.
  await expect(page.getByRole('button', { name: BUTTON })).toBeEnabled();
  await expect(page.getByText('Najpierw dodaj zdjęcie główne.')).toBeHidden();

  // Leave an item behind for the edit-screen tests. It gets a description so
  // the list has something to click by name.
  await page.getByRole('button', { name: CATEGORY }).click();
  await page.getByRole('textbox', { name: 'Opis', exact: true }).fill(ITEM);
  await page.getByRole('button', { name: 'Dodaj przedmiot' }).click();
  await expect(page).toHaveURL(/\/categories\/[^/]+\/items$/);

  await page.getByRole('link', { name: ITEM }).click();
  await expect(page).toHaveURL(/\/items\/[^/]+$/);
  itemUrl = page.url();
});

test('the same button is on the edit screen, enabled by the stored photo', async ({ page }) => {
  await page.goto(`${itemUrl}/edit`);

  // No file was picked in this session — the control is live off the original
  // already on disk.
  await expect(page.getByRole('button', { name: BUTTON })).toBeEnabled();
  await expectNoHorizontalOverflow(page);
});

test('overwriting an existing description asks first', async ({ page }) => {
  await page.goto(`${itemUrl}/edit`);

  const field = page.getByRole('textbox', { name: 'Opis', exact: true });
  await expect(field).toHaveValue(ITEM);
  await field.fill('Opis wpisany ręcznie.');

  await page.getByRole('button', { name: BUTTON }).click();

  // The confirmation stands between the click and the network call, so this
  // assertion runs without anything leaving the machine.
  await expect(page.getByText('Nadpisać opis?')).toBeVisible();

  await page.getByRole('button', { name: 'Anuluj' }).click();
  await expect(page.getByText('Nadpisać opis?')).toBeHidden();

  // Cancelling leaves what the user typed exactly as it was.
  await expect(field).toHaveValue('Opis wpisany ręcznie.');
});
