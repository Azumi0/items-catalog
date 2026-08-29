import { test as setup, expect } from '@playwright/test';
import { ACCOUNT, AUTH_FILE } from './constants';
import { authTitle, expectNoHorizontalOverflow, pageTitle } from './helpers';

/**
 * First run: an empty database has no users, so every authenticated route
 * redirects to /setup. Creating that first account is both the flow under test
 * and how the rest of the suite obtains a session.
 */
setup('first run creates the initial account', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/setup$/);

  await expect(authTitle(page, 'Konfiguracja katalogu')).toBeVisible();
  await expectNoHorizontalOverflow(page);

  // Fields are addressed by accessible name, not by label text: Mantine
  // appends a required asterisk, so the rendered label reads "Login *".
  await page.getByRole('textbox', { name: 'Login', exact: true }).fill(ACCOUNT.username);
  await page.getByRole('textbox', { name: 'Hasło', exact: true }).fill(ACCOUNT.password);
  await page.getByRole('textbox', { name: 'Powtórz hasło', exact: true }).fill(ACCOUNT.password);

  await page.getByRole('button', { name: 'Utwórz konto i zacznij' }).click();

  // Landing on the catalog is what proves the account exists and the session
  // cookie survived the redirect.
  await expect(page).toHaveURL(/\/$/);
  await expect(pageTitle(page, 'Katalog')).toBeVisible();
  await expect(page.getByText('Brak kategorii')).toBeVisible();

  await page.context().storageState({ path: AUTH_FILE });
});
