// @ts-check
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Reduce workers in CI to avoid resource contention
  workers: process.env.CI ? 1 : undefined,
  // Reduce default timeout for faster tests with Svelte
  timeout: 10000, // 10 seconds instead of default 30 seconds
  reporter: [
    ['html'],
    ...(process.env.CI ? [['github']] : [])
  ],
  use: {
    baseURL: 'http://localhost:3123',
    trace: process.env.CI ? 'on' : 'on-first-retry',
    screenshot: 'only-on-failure',
    video: process.env.CI ? 'on-first-retry' : 'off',
    // Reduce action timeout for faster interactions
    actionTimeout: 3000, // 3 seconds instead of default 30 seconds
    // Reduce navigation timeout
    navigationTimeout: 5000, // 5 seconds instead of default 30 seconds
    // Add headless mode configuration for Docker
    launchOptions: {
      headless: true,
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: process.env.CI ? 'npm run build && npm run preview' : 'npm run preview',
    url: 'http://localhost:3123',
    reuseExistingServer: true, // Set to true to reuse the existing server
    timeout: 120 * 1000, // Allow 2 minutes for the server to start
  },
});