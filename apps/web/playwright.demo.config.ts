import { defineConfig } from '@playwright/test';

/**
 * Separate config for recording demo videos (not the test suite). Runs serially
 * against an already-running server (PORT 3100 locally). Each spec creates its own
 * recorded browser context and saves a named .webm into docs/demo/.
 */
const baseURL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3100';

export default defineConfig({
  testDir: './demo',
  timeout: 240_000,
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: { baseURL },
});
