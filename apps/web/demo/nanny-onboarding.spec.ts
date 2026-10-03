import { test } from '@playwright/test';
import { recorded, beat, typeInto } from './_helpers';

/**
 * Golden path 1 — a nanny joins and completes onboarding (Armenian).
 * Register → profile → AI interview → documents → "Under review".
 */
test('nanny onboarding (hy)', async ({ browser }) => {
  const { page, finish } = await recorded(browser);
  const stamp = Date.now();

  // --- Register as a nanny ---
  await page.goto('/hy/auth/register');
  await beat(page, 1400);
  await page.getByRole('button', { name: 'Դայակ' }).click();
  await beat(page, 700);
  await typeInto(page, page.getByLabel('Անուն'), 'Անահիտ Գրիգորյան');
  await typeInto(page, page.getByLabel('Էլ. փոստ'), `demo-nanny-${stamp}@dayak.am`);
  await typeInto(page, page.getByLabel('Հեռախոս'), '+37491234567');
  await typeInto(page, page.getByLabel('Գաղտնաբառ'), 'supersecret1');
  await beat(page, 700);
  await page.getByRole('button', { name: 'Գրանցվել' }).click();
  await page.waitForURL(/\/hy\/nanny$/, { timeout: 15000 });
  await beat(page, 1800); // show the 4-step stepper

  // --- Profile basics ---
  await page.goto('/hy/nanny/profile');
  await beat(page, 1200);
  await page.getByLabel('Թաղամաս').selectOption('ARABKIR');
  await typeInto(page, page.getByLabel('Փորձի տարիներ'), '12');
  await page.getByRole('checkbox', { name: 'Հայերեն' }).check();
  await page.getByRole('checkbox', { name: 'Ռուսերեն' }).check();
  await page.getByRole('checkbox', { name: '1–3' }).check();
  await page.getByRole('checkbox', { name: '3–6' }).check();
  await page.getByRole('checkbox', { name: 'Ամբողջ օր' }).check();
  await beat(page, 800);
  await page.getByRole('button', { name: 'Պահպանել պրոֆիլը' }).click();
  await beat(page, 1600);

  // --- AI interview (the showcase) ---
  await page.goto('/hy/nanny');
  await beat(page, 900);
  await page.getByRole('link', { name: 'Սկսել հարցազրույցը' }).click();
  await page.waitForURL(/\/hy\/nanny\/interview$/);
  const ta = page.getByPlaceholder('Գրեք ձեր պատասխանը…');
  await ta.waitFor({ state: 'visible', timeout: 15000 });
  await beat(page, 1800); // let the opening question stream in

  const answers = [
    '12 տարվա փորձ ունեմ, աշխատել եմ չորս ընտանիքում։',
    '1–6 տարեկան երեխաների հետ ամենավստահ եմ աշխատում։',
    'Երբ երեխան ջերմեց, անմիջապես զանգեցի ծնողին և բժշկին։',
    'Պատրաստ եմ աշխատել Արաբկիրում և Կենտրոնում, ճանապարհը մոտ 40 րոպե է։',
    'Ժամով 1500 դրամ, ամսական 250,000 դրամ։',
    'Երկու երաշխավոր՝ ծնողներ, ում մոտ աշխատել եմ։',
  ];
  for (const ans of answers) {
    if (await page.getByText('Հարցազրույցն ավարտված է', { exact: false }).isVisible().catch(() => false)) break;
    if (!(await ta.isVisible().catch(() => false))) break;
    await typeInto(page, ta, ans);
    await beat(page, 500);
    await page.getByRole('button', { name: 'Ուղարկել' }).click();
    await beat(page, 2100); // watch the next question stream
  }
  // completion banner, then it returns to the dashboard
  await page.waitForURL(/\/hy\/nanny$/, { timeout: 15000 });
  await beat(page, 1800);

  // --- Documents ---
  await page.goto('/hy/nanny/documents');
  await beat(page, 1600); // the upload checklist
  await finish('nanny-onboarding');
});
