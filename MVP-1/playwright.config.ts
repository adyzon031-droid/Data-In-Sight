import { defineConfig } from "@playwright/test";

export default defineConfig({
  outputDir: "test-results/ui",
  testDir: "./tests/ui",
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:5173",
    viewport: { width: 1280, height: 900 },
    colorScheme: "light",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run preview:ui",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: !process.env.CI,
  },
});
