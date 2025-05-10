// @ts-check
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Reduce workers in CI to avoid resource contention
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ...(process.env.CI ? [['github']] : [])
  ],
  use: {
    baseURL: 'http://localhost:3123',
    trace: process.env.CI ? 'on' : 'on-first-retry',
    screenshot: 'only-on-failure',
    video: process.env.CI ? 'on-first-retry' : 'off',
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