import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: process.env.TM_QA_OUTPUT || "/tmp/tm-site-evidence/playwright",
  reporter: [["list"]],
  fullyParallel: true,
  workers: 2,
  use: {
    baseURL: process.env.TM_PREVIEW_URL || "http://127.0.0.1:4175",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 1000 } } },
    {
      name: "mobile",
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: process.env.TM_PREVIEW_URL
    ? undefined
    : {
        // A separate build keeps synthetic auth settings out of deployable dist/.
        command: "npm exec -- vite build --outDir qa/playwright-dist && npm run preview -- --host 127.0.0.1 --port 4175 --strictPort --outDir qa/playwright-dist",
        env: {
          VITE_SUPABASE_URL: "http://127.0.0.1:49951",
          VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_browser_test",
          VITE_POSTHOG_HOST: "https://eu.i.posthog.com",
          VITE_POSTHOG_PROJECT_TOKEN: "phc_browsertest",
        },
        port: 4175,
        reuseExistingServer: false,
      },
});
