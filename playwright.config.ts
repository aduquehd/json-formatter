import { defineConfig, devices } from '@playwright/test';

const port = 4173;
const baseURL = `http://127.0.0.1:${port}`;

/**
 * E2E smoke tests against a production build (`next start`).
 *
 * webServer builds into .next-e2e (via NEXT_DIST_DIR, see next.config.js)
 * before starting, so runs are self-contained and never clobber the .next
 * directory a live `pnpm dev` server is using. To skip the rebuild on
 * repeated local runs, keep a server alive yourself:
 *   NEXT_DIST_DIR=.next-e2e pnpm build && NEXT_DIST_DIR=.next-e2e pnpm exec next start -p 4173
 */
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: `pnpm build && pnpm exec next start -p ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    env: { NEXT_DIST_DIR: '.next-e2e' },
  },
});
