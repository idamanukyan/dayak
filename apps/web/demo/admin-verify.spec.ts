import { test, expect, type Page } from '@playwright/test';
import { recorded, beat } from './_helpers';

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

const NANNY_NAME = `Lusine Harutyunyan ${Date.now().toString().slice(-5)}`;

/** Offscreen setup: onboard a nanny to UNDER_REVIEW with uploaded docs (not recorded). */
async function onboardNanny(page: Page, email: string) {
  await page.goto('/en/auth/register');
  await page.getByRole('button', { name: 'Nanny' }).click();
  await page.getByLabel('Name').fill(NANNY_NAME);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Phone').fill(`+374${String(Date.now()).slice(-8)}`);
  await page.getByLabel('Password').fill('supersecret1');
  await page.getByRole('button', { name: 'Sign up' }).click();
  await expect(page).toHaveURL(/\/en\/nanny$/, { timeout: 15000 });

  await page.getByRole('link', { name: 'Start interview' }).click();
  const ta = page.getByPlaceholder('Type your answer…');
  await expect(ta).toBeEnabled({ timeout: 15000 });
  for (let i = 0; i < 10; i++) {
    if (await page.getByText('Interview complete — thank you!').isVisible().catch(() => false)) break;
    if (!(await ta.isVisible().catch(() => false))) break;
    await ta.fill(`Answer ${i} — honest and detailed.`);
    await page.getByRole('button', { name: 'Send' }).click();
    await page.waitForTimeout(600);
  }
  await page.waitForURL(/\/en\/nanny$/, { timeout: 15000 });

  await page.goto('/en/nanny/documents');
  const inputs = page.locator('input[type="file"]');
  for (let i = 0; i < 3; i++) {
    const resp = page.waitForResponse(
      (r) => r.url().includes('/api/documents') && r.request().method() === 'POST',
    );
    await inputs.nth(i).setInputFiles({ name: `doc${i}.png`, mimeType: 'image/png', buffer: PNG });
    await resp;
  }
}

/**
 * Golden path 3 — admin verifies a nanny (English admin console).
 * Shows the trust engine behind the badge: interview score, docs, reference calls.
 */
test('admin verifies a nanny (en)', async ({ browser }) => {
  // Setup in a throwaway, non-recorded context.
  const setupCtx = await browser.newContext({ baseURL: process.env.NEXT_PUBLIC_APP_URL });
  const setupPage = await setupCtx.newPage();
  await onboardNanny(setupPage, `demo-review-${Date.now()}@dayak.am`);
  await setupCtx.close();

  // Record the admin review + verify.
  const { page, finish } = await recorded(browser);
  await page.goto('/en/auth/login');
  await beat(page, 900);
  await page.getByLabel('Email').fill('admin@dayak.local');
  await page.getByLabel('Password').fill('admin1234');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL(/\/en\/admin/, { timeout: 15000 });
  await beat(page, 2000); // the verification queue

  await page
    .getByRole('row', { name: new RegExp(NANNY_NAME) })
    .getByRole('link', { name: /Review/ })
    .click();
  await expect(page).toHaveURL(/\/en\/admin\/nannies\//, { timeout: 10000 });
  await beat(page, 2600); // the 4-column review: profile / interview+score / docs / refs

  // Accept documents
  for (const btn of await page.getByRole('button', { name: 'Accept' }).all()) {
    await btn.click();
    await beat(page, 500);
  }
  // Mark references positive
  for (const btn of await page.getByRole('button', { name: 'positive' }).all()) {
    await btn.click();
    await beat(page, 500);
  }
  await beat(page, 800);

  // Verify with an in-person meeting date
  await page.reload();
  await beat(page, 1400);
  await page.getByRole('button', { name: 'Verify' }).click();
  await beat(page, 700);
  await page.locator('input[type="date"]').fill('2026-10-05');
  await beat(page, 600);
  await page.getByRole('button', { name: 'Confirm verify' }).click();
  await expect(page.getByText('VERIFIED')).toBeVisible({ timeout: 10000 });
  await beat(page, 2200);
  await finish('admin-verify');
});
