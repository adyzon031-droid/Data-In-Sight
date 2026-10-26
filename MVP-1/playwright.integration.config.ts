import { defineConfig } from "@playwright/test";
export default defineConfig({
  outputDir: "test-results/integration",
  testDir: "./tests/integration",
  workers: 1,
  fullyParallel: false,
  use: {
    screenshot: "only-on-failure",
    viewport: { width: 1280, height: 900 },
  },
});
