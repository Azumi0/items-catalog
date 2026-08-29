import { test, expect } from '@playwright/test';
import { ACCOUNT } from './constants';
import { authTitle, expectNoHorizontalOverflow, pageTitle } from './helpers';

test.describe('logout and login', () => {
  test('a session can be ended and started again', async ({ page }) => {
    await page.goto('/');
    await expect(pageTitle(page, 'Katalog')).toBeVisible();

    await page.getByRole('button', { name: 'Wyloguj się' }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(authTitle(page, 'Katalog Domowy')).toBeVisible();
    await expectNoHorizontalOverflow(page);

    // The catalog is genuinely closed, not merely unlinked.
    await page.goto('/categories');
    await expect(page).toHaveURL(/\/login$/);

    await page.getByRole('textbox', { name: 'Login', exact: true }).fill(ACCOUNT.username);
    await page.getByRole('textbox', { name: 'Hasło', exact: true }).fill(ACCOUNT.password);
    await page.getByRole('button', { name: 'Zaloguj się' }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(pageTitle(page, 'Katalog')).toBeVisible();
  });
});
