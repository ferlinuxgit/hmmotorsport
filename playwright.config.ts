import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["line"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev -- -H 127.0.0.1 -p 3100",
    url: "http://127.0.0.1:3100/api/live",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      APP_URL: "http://127.0.0.1:3100",
      BETTER_AUTH_URL: "http://127.0.0.1:3100",
      BETTER_AUTH_SECRET: "playwright-better-auth-secret-with-at-least-32-characters",
      JOB_RUNNER_SECRET: "playwright-job-runner-secret-with-at-least-32-characters",
      LOG_LEVEL: "error",
      RATE_LIMIT_BACKEND: "memory",
      EMAIL_PROVIDER: "console",
      STORAGE_PROVIDER: "local"
    }
  }
});
