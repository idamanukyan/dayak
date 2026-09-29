import { test, expect } from '@playwright/test';

async function registerNanny(page: import('@playwright/test').Page, email: string) {
  await page.goto('/en/auth/register');
  await page.getByRole('button', { name: 'Nanny' }).click();
  await page.getByLabel('Name').fill('Interview Nanny');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('supersecret1');
  await page.getByRole('button', { name: 'Sign up' }).click();
  await expect(page).toHaveURL(/\/en\/nanny$/, { timeout: 15000 });
}

test('nanny completes the AI interview (mock) and advances to DOCS_PENDING', async ({ page }) => {
  await registerNanny(page, `e2e-int-${Date.now()}@example.com`);

  // Start the interview from the dashboard.
  await page.getByRole('link', { name: 'Start interview' }).click();
  await expect(page).toHaveURL(/\/en\/nanny\/interview$/);

  // Opening question appears (auto-sent on mount).
  const textarea = page.getByPlaceholder('Type your answer…');
  await expect(textarea).toBeEnabled({ timeout: 15000 });

  // Answer until the interview completes (mock finishes after ~6 answers).
  for (let i = 0; i < 10; i++) {
    if (await page.getByText('Interview complete — thank you!').isVisible().catch(() => false)) break;
    await textarea.fill(`Answer number ${i} — honest and detailed.`);
    await page.getByRole('button', { name: 'Send' }).click();
    // Wait for the turn to finish (input re-enabled) or completion banner.
    await Promise.race([
      expect(textarea).toBeEnabled({ timeout: 15000 }),
      expect(page.getByText('Interview complete — thank you!')).toBeVisible({ timeout: 15000 }),
    ]).catch(() => {});
    await page.waitForTimeout(300);
  }

  await expect(page.getByText('Interview complete — thank you!')).toBeVisible({ timeout: 15000 });

  // Redirects back to the dashboard, now in Documents pending.
  await expect(page).toHaveURL(/\/en\/nanny$/, { timeout: 10000 });
  await expect(page.getByText('Documents pending')).toBeVisible({ timeout: 10000 });

  // The nanny UI must NEVER show the AI score (spec 11.2). 0–100 score not present.
  const body = await page.locator('body').innerText();
  expect(body).not.toContain('consistency');
  expect(body.toLowerCase()).not.toContain('aiscore');
});

test('interview resumes after a page refresh', async ({ page }) => {
  await registerNanny(page, `e2e-resume-${Date.now()}@example.com`);
  await page.getByRole('link', { name: 'Start interview' }).click();

  const textarea = page.getByPlaceholder('Type your answer…');
  await expect(textarea).toBeEnabled({ timeout: 15000 });
  await textarea.fill('My first answer to remember.');
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(page.getByText('My first answer to remember.')).toBeVisible({ timeout: 15000 });
  await expect(textarea).toBeEnabled({ timeout: 15000 });

  // Reload — the prior turn should still be there (transcript persisted).
  await page.reload();
  await expect(page.getByText('My first answer to remember.')).toBeVisible({ timeout: 15000 });
});
