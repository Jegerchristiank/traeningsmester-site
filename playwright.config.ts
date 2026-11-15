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
        command: "npm run preview -- --port 4175",
        port: 4175,
        reuseExistingServer: true,
      },
});
