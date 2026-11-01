import { defineConfig } from 'playwright/test';
export default defineConfig({
  testDir: '.', testMatch: '*.spec.mjs', workers: 1, timeout: 60000,
  outputDir: '../../.upgrade-artifacts/e2e-results',
  snapshotPathTemplate: '{testDir}/snapshots/{arg}{ext}',
  updateSnapshots: 'none',
  expect: { timeout: 10000, toHaveScreenshot: { animations: 'disabled', maxDiffPixelRatio: 0.001 } },
  reporter: [['list']],
});
