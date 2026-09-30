import { test, expect, type Page } from '@playwright/test';

async function registerParent(page: Page, name: string, email: string) {
  await page.goto('/en/auth/register');
  // Parent is the default role; no toggle needed, but click to be explicit.
  await page.getByRole('button', { name: 'Parent' }).click();
  await page.getByLabel('Name').fill(name);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('supersecret1');
  await page.getByRole('button', { name: 'Sign up' }).click();
  await expect(page).toHaveURL(/\/en\/dashboard$/, { timeout: 15000 });
}

test('filters narrow results to matching verified nannies', async ({ page }) => {
  await page.goto('/en/nannies?district=ARABKIR&language=RU&schedule=FULL_DAY');
  // Seeded Anahit (Arabkir, HY+RU, full day) matches; Marina (Kentron) must not show.
  await expect(page.getByText('Անահիտ', { exact: false }).first()).toBeVisible({ timeout: 10000 });
  await expect(page.getByText('Марина', { exact: false })).toHaveCount(0);
});

test('nanny phone is gated on FEE_PAID (API omits it until then)', async ({ browser }) => {
  const stamp = Date.now();
  const parentName = `PhoneParent ${stamp}`;

  const parentCtx = await browser.newContext();
  const page = await parentCtx.newPage();
  await registerParent(page, parentName, `e2e-phone-${stamp}@example.com`);

  // Open a verified nanny profile and capture her id.
  await page.goto('/en/nannies');
  await page.getByRole('link', { name: /View profile/ }).first().click();
  await expect(page).toHaveURL(/\/en\/nannies\/[^/]+$/);
  const nannyId = page.url().split('/').pop()!;

  // Before any request: API must not expose contact/phone.
  const before = await page.evaluate(async (id) => {
    const r = await fetch(`/api/nannies/${id}`);
    return r.json();
  }, nannyId);
  expect(before.contact).toBeNull();
  expect(JSON.stringify(before)).not.toContain('+374');

  // Request an introduction.
  await page.getByRole('button', { name: 'Request introduction' }).click();
  await page.getByRole('button', { name: 'Send request' }).click();
  await expect(page.getByText('Request sent!')).toBeVisible({ timeout: 10000 });

  // Still gated while status is NEW.
  const midway = await page.evaluate(async (id) => {
    const r = await fetch(`/api/nannies/${id}`);
    return r.json();
  }, nannyId);
  expect(midway.contact).toBeNull();

  // Admin marks the fee paid.
  const adminCtx = await browser.newContext();
  const admin = await adminCtx.newPage();
  await admin.goto('/en/auth/login');
  await admin.getByLabel('Email').fill('admin@dayak.local');
  await admin.getByLabel('Password').fill('admin1234');
  await admin.getByRole('button', { name: 'Log in' }).click();
  await expect(admin).toHaveURL(/\/en\/admin/, { timeout: 15000 }); // wait for auth to settle
  await admin.goto('/en/admin/requests');
  await expect(admin.getByText(parentName).first()).toBeVisible({ timeout: 10000 });
  // Innermost div that contains both the parent name and this card's Idram input.
  const card = admin
    .locator('div', { hasText: parentName })
    .filter({ has: admin.getByPlaceholder('Idram ref') })
    .last();
  await card.getByPlaceholder('Idram ref').fill(`IDRAM-${stamp}`);
  await card.getByRole('button', { name: 'Fee paid' }).click();
  await admin.waitForTimeout(1000);
  await adminCtx.close();

  // Now the parent sees the phone via the API and on the dashboard.
  const after = await page.evaluate(async (id) => {
    const r = await fetch(`/api/nannies/${id}`);
    return r.json();
  }, nannyId);
  expect(after.contact).not.toBeNull();
  expect(after.contact.phone).toContain('+374');

  await page.goto('/en/dashboard');
  await expect(page.getByText('Contact unlocked')).toBeVisible({ timeout: 10000 });

  await parentCtx.close();
});
