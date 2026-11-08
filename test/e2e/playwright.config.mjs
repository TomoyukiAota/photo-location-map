import { defineConfig } from 'playwright/test';

// The screenshots are compared with the references in snapshots/, or in the folder of test/e2e that
// PLM_VISUAL_REFERENCES names, such as the one that CI on macOS keeps for its runner (README.md).
const screenshotReferences = process.env.PLM_VISUAL_REFERENCES || 'snapshots';

export default defineConfig({
  testDir: '.', testMatch: '*.spec.mjs', workers: 1, timeout: 60000,
  outputDir: '../../.upgrade-artifacts/e2e-results',
  snapshotPathTemplate: '{testDir}/snapshots/{arg}{ext}',
  updateSnapshots: 'none',
  expect: {
    timeout: 10000,
    toHaveScreenshot: {
      animations: 'disabled', maxDiffPixelRatio: 0.001, pathTemplate: `{testDir}/${screenshotReferences}/{arg}{ext}`,
    },
  },
  reporter: [['list']],
});
