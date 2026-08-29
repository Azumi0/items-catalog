import { defineConfig, devices } from '@playwright/test';
import { AUTH_FILE, E2E_DATA_DIR } from './e2e/constants';

/**
 * The suite drives a production build (`next build` + `next start`), not
 * `next dev`: half of what an upgrade can break lives in the build and the
 * standalone output, and a dev-server run sails straight past it.
 *
 * Port 3100, never 3000 — a `next dev` you left running must not be mistaken
 * for the server under test, because a reused server would also skip the data
 * wipe below and leave the first-run flow with an account already in place.
 */
const PORT = 3100;

/**
 * Point the suite at an already-running server instead of building one — set
 * it to a running container to check the image actually boots and serves,
 * which `docker build` alone does not prove.
 */
const EXTERNAL_URL = process.env.E2E_BASE_URL;
const BASE_URL = EXTERNAL_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',

  // One SQLite file and one uploads directory are shared by every test, so
  // parallelism buys a five-test suite nothing and costs it determinism.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list']],

  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      use: { ...devices['Pixel 7'] },
    },
    {
      // The product is used on phones and the UI is mobile-first, so the
      // baseline runs at that viewport and nowhere else.
      name: 'mobile-chromium',
      use: { ...devices['Pixel 7'], storageState: AUTH_FILE },
      dependencies: ['setup'],
    },
  ],

  webServer: EXTERNAL_URL ? undefined : {
    // The wipe belongs in the server command: it then runs exactly once per
    // run, immediately before the server that reads the directory boots.
    //
    // `next start` warns that it is not the standalone entrypoint, and serves
    // the build correctly anyway. Running .next/standalone/server.js here
    // instead would move cwd away from the repo root, where src/db/index.ts
    // looks for drizzle/ — the container copies that folder in and migrates
    // separately. The standalone artifact is the `docker build` gate's job.
    command: `rm -rf ${E2E_DATA_DIR} && pnpm run build && pnpm exec next start -p ${PORT}`,
    url: BASE_URL,
    timeout: 240_000,
    reuseExistingServer: false,
    env: {
      DATA_DIR: E2E_DATA_DIR,
      NODE_ENV: 'production',
      // The repo has no committed .env, and iron-session refuses a secret
      // under 32 characters. A fixed throwaway value keeps runs reproducible.
      SESSION_SECRET: 'e2e-only-session-secret-not-for-production-use',
    },
  },
});
