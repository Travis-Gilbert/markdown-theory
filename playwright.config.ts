import { defineConfig, devices } from "@playwright/test";

/**
 * G7 browser harness (docs/plan/g7-browser-harness.md).
 *
 * The gates measure rendered pixels, so they need a real browser. Fixtures are
 * generated first (`pnpm demo:permutations && pnpm demo:readmes`) into
 * packages/galley/dist, then these gates load them over file:// and assert:
 * overflow, rendered contrast, orphans/widows, and permutation snapshots.
 *
 * Run the whole thing with `pnpm test:visual` (generates fixtures, then tests).
 */
export default defineConfig({
  testDir: "./tests/g7",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? "line" : [["list"]],
  expect: {
    // Small tolerance for sub-pixel font-AA jitter across machines.
    toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: "disabled" },
  },
  use: {
    ...devices["Desktop Chrome"],
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
