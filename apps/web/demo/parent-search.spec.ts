import { test } from '@playwright/test';
import { recorded, beat, typeInto } from './_helpers';

/**
 * Golden path 2 — a parent searches the map and requests an introduction (Armenian).
 * Shows the demand side: families looking for exactly the nanny you are.
 */
test('parent search + request (hy)', async ({ browser }) => {
  const { page, finish } = await recorded(browser);
  const stamp = Date.now();

  // --- Register as a parent ---
  await page.goto('/hy/auth/register');
  await beat(page, 1200);
  // Parent is the default role.
  await typeInto(page, page.getByLabel('Անուն'), 'Ընտանիք Հակոբյան');
  await typeInto(page, page.getByLabel('Էլ. փոստ'), `demo-parent-${stamp}@dayak.am`);
  await typeInto(page, page.getByLabel('Գաղտնաբառ'), 'supersecret1');
  await beat(page, 600);
  await page.getByRole('button', { name: 'Գրանցվել' }).click();
  await page.waitForURL(/\/hy\/dashboard$/, { timeout: 15000 });
  await beat(page, 1200);

  // --- Search: map + filters ---
  await page.goto('/hy/nannies');
  await beat(page, 3000); // let the OSM map + markers render

  // Filter to Arabkir + Russian — the demand that matches our nanny
  await page.getByRole('button', { name: 'Արաբկիր' }).click();
  await page.getByLabel('Լեզու').selectOption('RU');
  await beat(page, 700);
  await page.getByRole('button', { name: 'Կիրառել' }).click();
  await beat(page, 2200);

  // Open a profile
  await page.getByRole('link', { name: 'Դիտել պրոֆիլը' }).first().click();
  await page.waitForURL(/\/hy\/nannies\/[^/]+$/);
  await beat(page, 2400); // show verified badge, fee notice, gated contact

  // Request an introduction
  await page.getByRole('button', { name: 'Խնդրել ծանոթություն' }).click();
  await beat(page, 1600);
  await page.getByRole('button', { name: 'Ուղարկել հարցումը' }).click();
  await beat(page, 2600); // "Request sent!" confirmation
  await finish('parent-search-request');
});
