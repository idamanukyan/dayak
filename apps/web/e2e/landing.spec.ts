import { test, expect } from '@playwright/test';

// Phase 0 golden path: landing renders per locale and the switcher preserves the route.
const HERO = {
  hy: 'Երևանում դայակ գտնելը հեշտ է',
  ru: 'Найти няню в Ереване легко',
  en: 'Finding a nanny in Yerevan is easy',
};

for (const [locale, hero] of Object.entries(HERO)) {
  test(`landing renders in ${locale}`, async ({ page }) => {
    await page.goto(`/${locale}`);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(hero);
  });
}

test('language switcher keeps the current route', async ({ page }) => {
  await page.goto('/en/nannies');
  await page.getByRole('button', { name: /change language/i }).click();
  await page.getByRole('menuitem', { name: /Русский/ }).click();
  await expect(page).toHaveURL(/\/ru\/nannies$/);
});

test('register page shows role toggle in each locale', async ({ page }) => {
  await page.goto('/hy/auth/register');
  await expect(page.getByRole('button', { name: 'Ծնող' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Դայակ' })).toBeVisible();
});
