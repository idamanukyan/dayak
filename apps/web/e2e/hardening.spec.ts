import { test, expect } from '@playwright/test';

test('security headers are present', async ({ request }) => {
  const res = await request.get('/hy');
  const h = res.headers();
  expect(h['x-frame-options']).toBe('DENY');
  expect(h['x-content-type-options']).toBe('nosniff');
  expect(h['content-security-policy']).toContain("frame-ancestors 'none'");
});

test('login is rate limited after 5 attempts per IP+email', async ({ page }) => {
  const email = `rl-${Date.now()}@example.com`;
  await page.goto('/en/auth/login');

  for (let i = 0; i < 6; i++) {
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('wrong-password');
    await page.getByRole('button', { name: 'Log in' }).click();
    await page.waitForTimeout(400);
  }

  // The 6th attempt (limit is 5/15min) shows the rate-limit message.
  await expect(page.getByText('Too many attempts', { exact: false })).toBeVisible({ timeout: 10000 });
});

test('presign API requires auth (403) — rate limiter guards authed nannies', async ({ request }) => {
  // Unauthenticated presign is forbidden; the 20/hr limiter applies to authed nannies.
  const res = await request.post('/api/uploads/presign', {
    data: { docType: 'ID_FRONT', mime: 'image/png', sizeBytes: 100 },
  });
  expect(res.status()).toBe(403);
});
