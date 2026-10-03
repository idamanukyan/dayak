import { fileURLToPath } from 'node:url';
import path from 'node:path';
import type { Browser, BrowserContext, Page } from '@playwright/test';

const here = path.dirname(fileURLToPath(import.meta.url));
export const DEMO_DIR = path.resolve(here, '..', '..', '..', 'docs', 'demo');

export const VIEWPORT = { width: 1440, height: 900 };
const baseURL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3100';

/** A recorded context + page. Call finish(name) to save docs/demo/<name>.webm. */
export async function recorded(
  browser: Browser,
): Promise<{ context: BrowserContext; page: Page; finish: (name: string) => Promise<void> }> {
  const context = await browser.newContext({
    baseURL,
    viewport: VIEWPORT,
    recordVideo: { dir: DEMO_DIR, size: VIEWPORT },
    locale: 'hy-AM',
  });
  const page = await context.newPage();
  const finish = async (name: string) => {
    const video = page.video();
    await context.close(); // finalizes the recording
    if (video) {
      await video.saveAs(path.join(DEMO_DIR, `${name}.webm`));
      await video.delete(); // remove the auto-hashed original
    }
  };
  return { context, page, finish };
}

/** A watchable pause between actions. */
export async function beat(page: Page, ms = 1100): Promise<void> {
  await page.waitForTimeout(ms);
}

/** Type into a field at a human pace so the recording shows the keystrokes. */
export async function typeInto(page: Page, selector: ReturnType<Page['locator']>, text: string) {
  await selector.click();
  await selector.pressSequentially(text, { delay: 45 });
}
