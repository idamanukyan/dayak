import { test, expect, type Page } from '@playwright/test';

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

async function onboardToReview(page: Page, name: string, email: string) {
  await page.goto('/en/auth/register');
  await page.getByRole('button', { name: 'Nanny' }).click();
  await page.getByLabel('Name').fill(name);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('supersecret1');
  await page.getByRole('button', { name: 'Sign up' }).click();
  await expect(page).toHaveURL(/\/en\/nanny$/, { timeout: 15000 });

  // Interview (mock) → seeds 2 parent-employer refs, moves to DOCS_PENDING
  await page.getByRole('link', { name: 'Start interview' }).click();
  const ta = page.getByPlaceholder('Type your answer…');
  await expect(ta).toBeEnabled({ timeout: 15000 });
  for (let i = 0; i < 12; i++) {
    const done = await page.getByText('Interview complete — thank you!').isVisible().catch(() => false);
    const redirected = /\/en\/nanny$/.test(page.url());
    if (done || redirected) break;
    if (!(await ta.isVisible().catch(() => false))) break;
    await ta.fill(`Answer ${i}.`);
    await page.getByRole('button', { name: 'Send' }).click();
    await page.waitForTimeout(700);
  }
  // The chat hard-redirects to the dashboard ~2.5s after completion.
  await page.waitForURL(/\/en\/nanny$/, { timeout: 12000 });

  // Upload 3 docs → UNDER_REVIEW
  await page.goto('/en/nanny/documents');
  const inputs = page.locator('input[type="file"]');
  for (let i = 0; i < 3; i++) {
    const resp = page.waitForResponse(
      (r) => r.url().includes('/api/documents') && r.request().method() === 'POST',
    );
    await inputs.nth(i).setInputFiles({ name: `d${i}.png`, mimeType: 'image/png', buffer: PNG });
    await resp;
  }
}

async function loginAdmin(page: Page) {
  await page.goto('/en/auth/login');
  await page.getByLabel('Email').fill('admin@dayak.local');
  await page.getByLabel('Password').fill('admin1234');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL(/\/en\/(dashboard|admin)/, { timeout: 15000 });
}

test('non-admin gets 403 from admin document API', async ({ page }) => {
  await onboardToReview(page, `AuthNanny ${Date.now()}`, `e2e-authz-${Date.now()}@example.com`);
  const status = await page.evaluate(async () => {
    const r = await fetch('/api/admin/documents/nonexistent/url');
    return r.status;
  });
  expect(status).toBe(403);
});

test('admin verifies a nanny end-to-end', async ({ browser }) => {
  const stamp = Date.now();
  const name = `VerifyMe ${stamp}`;

  // 1. Onboard a nanny to UNDER_REVIEW in its own context.
  const nannyCtx = await browser.newContext();
  const nannyPage = await nannyCtx.newPage();
  await onboardToReview(nannyPage, name, `e2e-verify-${stamp}@example.com`);
  await nannyCtx.close();

  // 2. Admin reviews and verifies.
  const adminCtx = await browser.newContext();
  const page = await adminCtx.newPage();
  await loginAdmin(page);
  await page.goto('/en/admin');
  await page.getByRole('row', { name: new RegExp(name) }).getByRole('link', { name: /Review/ }).click();
  await expect(page).toHaveURL(/\/en\/admin\/nannies\//, { timeout: 10000 });

  // Accept all uploaded documents
  for (const btn of await page.getByRole('button', { name: 'Accept' }).all()) {
    await btn.click();
    await page.waitForTimeout(200);
  }
  // Mark both references positive
  for (const btn of await page.getByRole('button', { name: 'positive' }).all()) {
    await btn.click();
    await page.waitForTimeout(200);
  }

  // Reload so the verify gate recomputes, then verify with a meeting date.
  await page.reload();
  await page.getByRole('button', { name: 'Verify' }).click();
  await page.locator('input[type="date"]').fill('2026-10-01');
  await page.getByRole('button', { name: 'Confirm verify' }).click();

  await expect(page.getByText('VERIFIED')).toBeVisible({ timeout: 10000 });

  await adminCtx.close();
});
