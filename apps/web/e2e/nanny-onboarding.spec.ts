import { test, expect } from '@playwright/test';

// 1x1 PNG
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

test('nanny completes onboarding and reaches UNDER_REVIEW', async ({ page }) => {
  const email = `e2e-onb-${Date.now()}@example.com`;

  // Register (en)
  await page.goto('/en/auth/register');
  await page.getByRole('button', { name: 'Nanny' }).click();
  await page.getByLabel('Name').fill('Onboarding Nanny');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('supersecret1');
  await page.getByRole('button', { name: 'Sign up' }).click();
  await expect(page).toHaveURL(/\/en\/nanny$/, { timeout: 15000 });

  // Profile basics
  await page.goto('/en/nanny/profile');
  await page.getByLabel('District').selectOption('ARABKIR');
  await page.getByLabel('Years of experience').fill('6');
  await page.getByRole('checkbox', { name: 'Armenian' }).check();
  await page.getByRole('checkbox', { name: '1–3' }).check();
  await page.getByRole('checkbox', { name: 'Full day' }).check();
  await page.getByRole('button', { name: 'Save profile' }).click();
  await expect(page.getByText('Profile saved')).toBeVisible({ timeout: 10000 });

  // AI interview (mock) — seeds references and advances to DOCS_PENDING
  await page.goto('/en/nanny');
  await page.getByRole('link', { name: 'Start interview' }).click();
  const textarea = page.getByPlaceholder('Type your answer…');
  await expect(textarea).toBeEnabled({ timeout: 15000 });
  for (let i = 0; i < 10; i++) {
    if (await page.getByText('Interview complete — thank you!').isVisible().catch(() => false)) break;
    await textarea.fill(`Answer ${i} — honest and detailed.`);
    await page.getByRole('button', { name: 'Send' }).click();
    await Promise.race([
      expect(textarea).toBeEnabled({ timeout: 15000 }),
      expect(page.getByText('Interview complete — thank you!')).toBeVisible({ timeout: 15000 }),
    ]).catch(() => {});
    await page.waitForTimeout(300);
  }
  await expect(page).toHaveURL(/\/en\/nanny$/, { timeout: 10000 });
  await expect(page.getByText('Documents pending')).toBeVisible({ timeout: 10000 });

  // Upload the 3 required documents → review gate met (interview seeded 2 references)
  await page.goto('/en/nanny/documents');
  const inputs = page.locator('input[type="file"]');
  for (let i = 0; i < 3; i++) {
    const resp = page.waitForResponse(
      (r) => r.url().includes('/api/documents') && r.request().method() === 'POST',
    );
    await inputs.nth(i).setInputFiles({ name: `doc${i}.png`, mimeType: 'image/png', buffer: PNG });
    await resp;
  }

  // Status should now be UNDER_REVIEW
  await page.goto('/en/nanny');
  await expect(page.getByText('Under review')).toBeVisible({ timeout: 10000 });
});
